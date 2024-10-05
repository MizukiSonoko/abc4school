"use client"

import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Discomfort } from '../video/client';
import { Card } from '@/components/ui/card';
import { animated, useTransition } from '@react-spring/web';
import { useSearchParams } from 'next/navigation';

export default function LinkedInStyleUI() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '00';
  const [discomforts, setDiscomforts] = useState<Discomfort[]>([]);
  ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

  const downloadDiscomforts = async () => {
    const resp = await supabase.from('discomforts').select('id, time, pupils_id, video_id, pupils (name)')
    if(resp.data) {
      setDiscomforts(resp.data.filter((d) => (d.pupils as any).name === name).map((d) => { 
        return { 
          id: d.id,
          pupilsId: d.pupils_id,
          pupilsName: (d.pupils as any).name,
          time: d.time,
          videoId: d.video_id
        } as Discomfort}))
    }
  }

  useEffect(() => {
    downloadDiscomforts();
  }, [])
  
  if(name === "みずき") {
    
  }
  const data = {
    labels: ['自然', '社会', '人', '音楽', '本'], // 5つの項目
    datasets: [
      {
        label: '違和感データ',
        data: name === "みずき" ? [discomforts.length, 1, 0, 2, 5]: [discomforts.length, 0, 2, 12, 1],
        backgroundColor: 'rgba(34, 202, 236, 0.2)', // 塗りつぶし色
        borderColor: 'rgba(34, 202, 236, 1)', // 枠線色
        borderWidth: 2, // 枠線の太さ
      },
    ],
  };

  const transitions = useTransition(discomforts, {
    from: { opacity: 0, transform: 'translate3d(100%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, height: 0, transform: 'translate3d(-50%,0,0)' },
    keys: discomfort => discomfort.id,
    config: { tension: 220, friction: 20 },
  });

  // オプション設定
  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,  // 最小値を設定
        suggestedMax: 30,  // 最大値を設定
      },
    },
  };


  return (
    <div className="bg-gray-100 min-h-screen flex justify-center">
      <div className="mx-auto w-3/5 mx-4">
        <div className="bg-white p-4 rounded-md mt-12 mb-4">
            <div className='text-3xl text-center'>
              {name}
            </div>
        </div>

        <div className="bg-white p-4 rounded-md mb-4">
          <Radar data={data} options={options} />
        </div>

      {/* Right side: Discomfort List */}
      <div className="pl-4">
        <h2 className="text-xl font-bold mb-4">もやもやリスト</h2>
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {transitions((style, discomfort) => (
            <animated.div style={style}>
              <Card
                key={discomfort.id}
                className={`p-4 cursor-pointer bg-white hover:bg-gray-100`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{discomfort.time}</span>
                  <span className="text-base">{discomfort.pupilsName}</span>
                  <span className="text-base">Video:{discomfort.videoId}</span>
                </div>
              </Card>
            </animated.div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
