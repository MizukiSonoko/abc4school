"use client"
import React, { useState, useEffect } from 'react';
import { useSearchParams } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function CenteredCircleButtonPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inProgress, setInProgress] = useState(false);

  const [currentTime, setCurrentTime] = useState('');
  const [pupilsId, setPupilsId] = useState('');

  const [name, setName] = useState('');
  const searchParams = useSearchParams();

  // URLからclass_tokenを取得
  const class_token = searchParams.get('class_token') || '';
  const video_id = searchParams.get('video_id');

  useEffect(() => {
    const storedId = localStorage.getItem('id');
    setPupilsId(storedId || '');
    const storedName = localStorage.getItem('name');

    // 名前やパスワードが保存されていない場合にモーダルを開く
    if (!storedName) {
      setIsModalOpen(true);
    }else{
      const allChanges = supabase
        .channel(class_token)
      allChanges.on('broadcast', { event: 'move' }, data => {
        setCurrentTime(data.payload.time)
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
    }
  }, [class_token]);

  const handleRegister = async () => {
    localStorage.setItem('name', name);
    const { error } = await supabase
      .from('pupils')
      .insert({ name, pass: '0000' })
    console.log(error)
    const resp = await supabase.from('pupils').select('id').eq('name', name)
    localStorage.setItem('id', resp.data![0].id);
    setIsModalOpen(false);
  };

  const handleAddDiscomfort = async () => {
    setInProgress(true)
    const { error } = await supabase
      .from('discomforts')
      .insert({ 
        video_id: video_id,
        classroom_id: 0,
        pupils_id: Number(pupilsId),
        time: currentTime
      })
    console.log(error)
    setInProgress(false)
  }
  return (
    <div className="bg-gray-100 min-h-screen"> 
      <div className="flex items-center py-48 justify-center">
        
        {/* 巨大な丸いボタン */}
        <button 
          className="bg-red-500 text-white w-64 h-64 rounded-full text-6xl font-bold shadow-lg hover:bg-red-600 transition duration-300 ease-in-out"
          onClick={handleAddDiscomfort}
          onTouchStart={handleAddDiscomfort}
        >
          まてぃ！
        </button>

      </div>
      <div>
        <div className="text-center text-sm text-gray-600">
          [{currentTime}]
        </div>
        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-md shadow-lg">
              <h2 className="text-xl font-bold mb-4">なまえをいれてね！</h2>
              <div className="mb-4">
                <label className="block mb-1">なまえ</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="text-center">
                <button
                  onClick={handleRegister}
                  className="bg-red-500 text-white text-center select-none mx-auto px-4 py-2 rounded-md"
                  disabled={inProgress}
                >
                  すすむ
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
    </div>
  );
}
