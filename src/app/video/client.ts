
export interface Video {
  id: number;
  name: string;
  thumbnail: string;
  src: string;
  hashTag: string[]
}

export interface Discomfort {
  id: number;
  pupilsId: number;
  pupilsName: string;
  videoId: number;
  time: string;
}

