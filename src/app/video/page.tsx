"use client"
import React, { Suspense } from 'react';
import Container from './container';

export default function VideoPage() {
  return (
    <Suspense>
      <Container />
    </Suspense>
  );
}
