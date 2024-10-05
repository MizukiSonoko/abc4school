"use client"
import React, { useState, useRef, useEffect } from 'react';
import * as Slider from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Discomfort, Video } from './client';
import { Card } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, animated } from '@react-spring/web';
import { Dialog, DialogOverlay, DialogContent } from "@reach/dialog"
import "@reach/dialog/styles.css"

const CustomVideoPlayer: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter()

  const class_token = searchParams.get('class_token') || '00';
  const sender = supabase.channel(class_token)

  const [isQRCodeVisible, setIsQRCodeVisible] = useState(false);  // QRコードの表示状態を管理

  const toggleQRCode = () => {
    setIsQRCodeVisible(!isQRCodeVisible);  // QRコードの表示状態を切り替え
  };

  const videoRef = useRef<HTMLVideoElement>(null);  // videoタグへの参照
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);  // 再生状態の管理
  const [progress, setProgress] = useState(0);  // シークバーの進捗を管理
  const [volume, setVolume] = useState(1);  // 音量の管理
  const [isMuted, setIsMuted] = useState(false);  // ミュート状態の管理
  const [currentVideo, setCurrentVideo] = useState<Video>();  // 現在再生中の動画
  const [heatmapData, setHeatmapData] = useState<number[]>([]);  // ヒートマップデータの管理
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");  

  const [videos, setVideos] = useState<Video[]>([]);
  const [pupils, setPuplis] = useState<string[]>([])
  const [discomforts, setDiscomforts] = useState<Discomfort[]>([]);
  const [latestDiscomfort, setLatestDiscomfort] = useState<Discomfort | null>(null);

  // ヒートマップデータを生成する関数
  const generateHeatmapData = () => {
    if (!videoRef.current) return;

    const heatmap = Array(100).fill(0);  // 100個のスライダーインデックスに対応するデータ
    const videoDuration = videoRef.current.duration;  // 動画全体の長さ

    // 現在再生中の動画に関連するコメントを処理
    discomforts
      .filter((discomfort) => discomfort.videoId === currentVideo?.id)
      .forEach((discomfort) => {
        const timeParts = discomfort.time.split(':').map(Number);  // タイムスタンプを分と秒に分割
        const timeInSeconds = timeParts[0] * 60 + timeParts[1];  // 分と秒を秒数に変換
        const percentage = (timeInSeconds / videoDuration) * 100;  // 動画の再生時間全体に対する割合
        const index = Math.floor(percentage);  // ヒートマップのインデックスを計算

        if (index >= 0 && index < 100) {
          heatmap[index] += 1;  // コメントがある場所にカウントを追加
        }
      });

    setHeatmapData(heatmap);  // ヒートマップデータを更新
  };
  
  const fetchRealtimeData = () => {
    try {
      supabase
        .channel(class_token)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'discomforts'
          },
          async (data) => {
            console.log(data.new)
            if(data.eventType === "INSERT"){
              console.log(data.new.id)
              const resp = await supabase.
                from('discomforts').
                select('id, time, pupils_id, video_id, pupils (name)').
                eq('id', data.new.id)
              const newDiscomfort = { 
                id: resp.data![0].id,
                pupilsId: resp.data![0].pupils_id,
                pupilsName: (resp.data![0].pupils as any).name,
                time: resp.data![0].time,
                videoId: resp.data![0].video_id,
              } as Discomfort;
              setDiscomforts((prevDiscomforts) => [newDiscomfort, ...prevDiscomforts]);
              setLatestDiscomfort(newDiscomfort);
              generateHeatmapData();
            }
          }
        )
        .subscribe()

      return () => supabase.channel(class_token).unsubscribe()
    } catch (error) {
      console.error(error)
    }
  }

  const downloadVideos = async () => {
    const resp = await supabase.from('videos').select('*')
    if(resp.data) {
      const gotVideos = resp.data.map((v) => {
        return { 
          id: v.id, src: v.url, name: v.name, hashTag: v.hashtag.tag, thumbnail: v.thumbnail
        } as Video})
      setVideos(gotVideos)
      setCurrentVideo(gotVideos[0])
    }
  }
  
  const downloadDiscomforts = async () => {
    const resp = await supabase.from('discomforts').select('id, time, pupils_id, video_id, pupils (name)')
    if(resp.data) {
      setDiscomforts(resp.data.map((d) => { 
        return { 
          id: d.id,
          pupilsId: d.pupils_id,
          pupilsName: (d.pupils as any).name,
          time: d.time,
          videoId: d.video_id
        } as Discomfort}))
    }
  }

  const downloadPupils = async () => {
    const resp = await supabase.from('pupils').select('*')
    if(resp.data) {
      console.log(resp)
      setPuplis(resp.data.map((v) => v.name))
    }
  }

  useEffect(() => {
    if (videos.length === 0) {
      downloadVideos();
      downloadDiscomforts();
      downloadPupils();
    }
    fetchRealtimeData()
    generateHeatmapData()
  }, [])

  useEffect(() => { 
    const video = videoRef.current;
    if (!video) return;

    // 動画の進捗を更新するためのイベントリスナー
    const updateProgress = async () => {
      const progress = (video.currentTime / video.duration) * 100;  // 現在の進捗をパーセンテージで計算

      const minutes = Math.floor(video.currentTime / 60);
      const seconds = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
      setCurrentTime(`${minutes}:${seconds}`);
      setProgress(progress);

      // 生徒に送信
      console.log('send')
      await sender.send({
        type: 'broadcast',
        event: 'move',
        payload: { time: `${minutes}:${seconds}`, video: currentVideo?.id },
      })
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [sender, videos, currentVideo]);

  useEffect(() => {
    generateHeatmapData();
  }, [discomforts, currentVideo]);

  // ヒートマップの色を決定する関数
  const getHeatmapColor = (intensity: number) => {
    const maxIntensity = Math.max(...heatmapData);  // ヒートマップでの最大値を取得
    const opacity = intensity / maxIntensity;  // 最大値に基づいて透明度を決定
    return `rgba(255, 0, 0, ${opacity})`;  // 赤の濃淡を計算 (透明度によって濃さを変える)
  };

  // 再生/一時停止を切り替える関数
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();  // 再生中なら一時停止
      } else {
        videoRef.current.play();  // 停止中なら再生
      }
      setIsPlaying(!isPlaying);  // 再生状態をトグル
    }
  };

  // シークバーで再生位置を変更する関数
  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * videoRef.current.duration;  // シークバー位置を再生時間に変換
      videoRef.current.currentTime = newTime;  // 再生位置を設定
      setProgress(value[0]);  // シークバーの進捗を更新
    }
  };

  // 音量の変更を処理する関数
  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0] / 100;  // 音量を0から1に変換
      videoRef.current.volume = newVolume;  // 動画の音量を設定
      setVolume(newVolume);  // 音量の状態を更新
      setIsMuted(newVolume === 0);  // 音量が0の場合はミュート状態に設定
    }
  };

  // ミュート状態を切り替える関数
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;  // ミュート状態をトグル
      setIsMuted(!isMuted);  // ミュート状態を更新
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      if (direction === 'left') {
        carouselRef.current.scrollLeft -= scrollAmount;
      } else {
        carouselRef.current.scrollLeft += scrollAmount;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((videoContainerRef.current as any).mozRequestFullScreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (videoContainerRef.current as any).mozRequestFullScreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (videoContainerRef.current as any).webkitRequestFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((videoContainerRef.current as any).msRequestFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (videoContainerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).mozCancelFullScreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).mozCancelFullScreen();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).webkitExitFullscreen) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).webkitExitFullscreen();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).msExitFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };
  
  // サムネイルをクリックして動画を切り替える関数
  const handleThumbnailClick = (video: Video) => {
    setCurrentVideo(video);  // 現在の動画を選択された動画に変更
    setIsPlaying(false);  // 再生状態をリセット
    setProgress(0);  // シークバーの進捗をリセット
    if (videoRef.current) {
      videoRef.current.src = video.src;  // 新しい動画をセット
      videoRef.current.currentTime = 0;  // 再生位置をリセット
    }
  };

  const handleTimestampClick = (timestamp: string) => {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    const time = minutes * 60 + seconds;
    if (videoRef.current) {
      console.log(time, videoRef.current.duration)
      videoRef.current.currentTime = time;
      const newTime =  (time / videoRef.current.duration) * 100; 
      setProgress(newTime);  
    }
  };

  const transitions = useTransition(discomforts, {
    from: { opacity: 0, transform: 'translate3d(100%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, height: 0, transform: 'translate3d(-50%,0,0)' },
    keys: discomfort => discomfort.id,
    config: { tension: 220, friction: 20 },
  });
  
  return (
    <div className="max-w-7xl mx-auto mt-10 p-4 flex">
      {/* Left side: Video Player */}
      <div className="w-2/3 pr-4">
        {/* Video Player */}
        <div className="relative" ref={videoContainerRef}>
          {currentVideo && (
            <>
              <p className='text-2xl font-bold mb-2'>{currentVideo.name}</p>
              {currentVideo.hashTag.map((hashTag: string) => (
                <p key={hashTag} className='text-base mb-2 inline px-2'>{hashTag}</p>
              ))}
              <hr/>
              <video
                ref={videoRef}
                className="mt-4 w-full rounded-lg shadow-lg"
                src={currentVideo.src}
              />
            </>
          )}
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
            <div className="flex items-center space-x-2">
              <Button onClick={togglePlay} variant="ghost" size="sm" className="text-white hover:text-gray-200">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button onClick={toggleMute} variant="ghost" size="sm" className="text-white hover:text-gray-200">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-20 h-5"
                value={[volume * 100]}
                max={100}
                onValueChange={handleVolumeChange}
              >
                <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-3 h-3 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Volume"
                />
              </Slider.Root>
              <Button onClick={toggleFullscreen} variant="ghost" size="sm" className="text-white hover:text-gray-200">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Seek bar and Heatmap */}
        <div className="mt-2 relative">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
          >
            {/* Heatmap */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              {heatmapData.map((intensity, index) => (
                <div
                  key={index}
                  style={{
                    width: '1%',
                    backgroundColor: getHeatmapColor(intensity),
                  }}
                />
              ))}
            </div>
            {/* Seek bar */}
            <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Seek"
            />
          </Slider.Root>
        </div>

        {/* Current Time */}
        <div className="text-center text-sm mt-2 text-gray-600">
          <p className="px-2 inline">現在の再生時間: {currentTime}</p>
          <Button onClick={toggleQRCode} className="mt-4">
            {isQRCodeVisible ? "QRコードを非表示" : "QRコードを表示"}
          </Button>
        </div>

        {/* Video Carousel */}
        <div className="mt-4 relative">
          <Button
            onClick={() => scrollCarousel('left')}
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div
            ref={carouselRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide py-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex-shrink-0 cursor-pointer"
                onClick={() => handleThumbnailClick(video)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.name}
                  className="w-32 h-32 object-cover rounded-md"
                />
                <p className="mt-1 text-sm text-center">{video.name}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => scrollCarousel('right')}
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        <div
            className="flex space-x-4 overflow-x-auto scrollbar-hide py-2"
          >
            {pupils.map((p) => (
              <div
                key={p}
                className="flex-shrink-0 cursor-pointer"
                onClick={() => router.push(`/detail?name=`+p)}
              >
                <p className="mt-1 text-sm text-center">{p}</p>
              </div>
            ))}
          </div>
      </div>

      {/* Right side: Discomfort List */}
      <div className="w-1/3 pl-4">
        <h2 className="text-xl font-bold mb-4">もやもやリスト</h2>
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {transitions((style, discomfort) => (
            <animated.div style={style}>
              <Card
                key={discomfort.id}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  latestDiscomfort && latestDiscomfort.id === discomfort.id ? 'bg-yellow-100' : ''
                }`}
                onClick={() => handleTimestampClick(discomfort.time)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{discomfort.time}</span>
                  <span className="text-base">{discomfort.pupilsName}</span>
                  <span className="text-base"></span>
                </div>
              </Card>
            </animated.div>
          ))}
        </div>
      </div>

      {/* モーダル表示 */}
      {isQRCodeVisible && (
          <Dialog isOpen={isQRCodeVisible} onDismiss={() => setIsQRCodeVisible(false)}>
            <DialogOverlay>
              <DialogContent className="bg-white rounded p-8 z-50">
                <div className="mt-4">
                  <img
                    src='/qr.png'
                    alt={'qr'}
                    className="w-128 h-128 object-cover rounded-md"
                  />
                </div>
                <button
                  onClick={() => setIsQRCodeVisible(false)}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
                >
                  閉じる
                </button>
              </DialogContent>
            </DialogOverlay>
          </Dialog>
        )}
    </div>
  );
};

export default CustomVideoPlayer;
