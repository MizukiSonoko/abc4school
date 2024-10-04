"use client"
import React from 'react';

export default function LinkedInStyleUI() {
  return (
    <div className="bg-gray-100 min-h-screen flex justify-center">
      <div className="mx-auto w-3/5 mx-4">
        <div className="bg-white p-4 rounded-md mt-12 mb-4">
            <div className='text-3xl text-center'>
              「生命」
            </div>
            <div className="flex mt-2 justify-around">
              A
            </div>
        </div>

        <div className="bg-white p-4 rounded-md mb-4">
        <p>なんかデータ？</p>
        <p>なんかデータ？</p>
        <p>なんかデータ？</p>
        <p>なんかデータ？</p>
        </div>

        {/* Post */}
        <div className="bg-white p-4 rounded-md mb-4">
          <div className="flex items-center mb-2">
            <img
              src="https://placehold.jp/150x150.png"
              alt="Post Owner"
              className="rounded-full w-8 h-8"
            />
            <div className="ml-2">
              <h3 className="font-bold">たなか</h3>
              <p className="text-sm text-gray-500">広瀬小学校教師</p>
            </div>
          </div>
          <p className="text-gray-700 mb-2">
            三人チームでやってみました！<br/>
            <br/>
          </p>
          <img
            src="https://placehold.jp/150x150.png"
            alt="Post"
            className="w-full rounded-md"
          />
        </div>
      </div>
    </div>
  );
}
