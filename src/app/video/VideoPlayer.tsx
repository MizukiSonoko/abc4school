"use client"
import React, { useState, useRef, useEffect } from 'react';
import * as Slider from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Discomfort } from './client';

// 動画のデータ型
export interface Video {
  id: number;
  title: string;
  thumbnail: string;
  src: string;
}

type Props = {
  video: Video
  discomforts: Discomfort[]
  isPlaying: boolean
  progress: number
  onSeekBarClick: () => void
  onPlayButtonClick: () => void
};

const VideoPlayer: React.FC<Props> = (props: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);  // videoタグへの参照
  const [isPlaying, setIsPlaying] = useState(false);  // 再生状態の管理
  const [progress, setProgress] = useState(0);  // シークバーの進捗を管理
  const [volume, setVolume] = useState(1);  // 音量の管理
  const [isMuted, setIsMuted] = useState(false);  // ミュート状態の管理
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [heatmapData, setHeatmapData] = useState<number[]>([]);  // ヒートマップデータの管理

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
  
    // 動画の進捗を更新するためのイベントリスナー
    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;  // 現在の進捗をパーセンテージで計算
      setProgress(progress);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);


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

  // ヒートマップデータを生成する関数
  const generateHeatmapData = () => {
    if (!videoRef.current) return;

    const heatmap = Array(100).fill(0);  // 100個のスライダーインデックスに対応するデータ
    const videoDuration = videoRef.current.duration;  // 動画全体の長さ

    // 現在再生中の動画に関連するコメントを処理
    props.discomforts
      .filter((discomfort) => discomfort.videoId === props.video.id)
      .forEach((discomfort) => {
        const timeParts = discomfort.time.split(':').map(Number);  // タイムスタンプを分と秒に分割
        const timeInSeconds = timeParts[0] * 60 + timeParts[1];  // 分と秒を秒数に変換
        const percentage = (timeInSeconds / videoDuration) * 100;  // 動画の再生時間全体に対する割合
        const index = Math.floor(percentage);  // ヒートマップのインデックスを計算

        if (index >= 0 && index < 100) {
          heatmap[index] += 1;  // コメントがある場所にカウントを増やす
        }
      });

    setHeatmapData(heatmap);  // ヒートマップデータを更新
  };

  useEffect(() => {
    generateHeatmapData();
  }, [generateHeatmapData]);

  // ヒートマップの色を決定する関数
  const getHeatmapColor = (intensity: number) => {
    const maxIntensity = Math.max(...heatmapData);  // ヒートマップでの最大値を取得
    const opacity = intensity / maxIntensity;  // 最大値に基づいて透明度を決定
    return `rgba(255, 0, 0, ${opacity})`;  // 赤の濃淡を計算 (透明度によって濃さを変える)
  };  

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      {/* 動画プレイヤー */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full rounded-lg shadow-lg"
          src={props.video.src}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
          <div className="flex items-center space-x-2">
            {/* 再生/一時停止ボタン */}
            <Button onClick={togglePlay} variant="ghost" size="sm" className="text-white hover:text-gray-200">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-2">
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
            </div>
            <Button onClick={toggleFullscreen} variant="ghost" size="sm" className="text-white hover:text-gray-200">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* シークバーとヒートマップ */}
      <div className="mt-2 relative">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={handleSeek}
        >
          {/* ヒートマップ表示 */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            {heatmapData.map((intensity, index) => (
              <div
                key={index}
                style={{
                  width: '1%',  // 各スライダーの位置を表す1%の幅
                  backgroundColor: getHeatmapColor(intensity),  // ヒートマップの色を設定
                }}
              />
            ))}
          </div>

          {/* シークバー */}
          <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
            <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Seek"
          />
        </Slider.Root>
      </div>
    </div>
  );
};

export default VideoPlayer;
