"use client"
import React, { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"

interface Comment {
  author: string
  text: string
  imageUrl?: string
}

interface CardDetailPageProps {
  cardTitle: string
  description: string
  initialComments: Comment[]
}

const CardDetailPage: React.FC<CardDetailPageProps> = ({
  cardTitle,
  description,
  initialComments
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState<string>("")
  const [newAuthor, setNewAuthor] = useState<string>("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  const handleCommentSubmit = () => {
    if (!newComment || !newAuthor) return

    const newCommentObj: Comment = {
      author: newAuthor,
      text: newComment,
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
    }

    setComments([...comments, newCommentObj])
    setNewComment("")
    setNewAuthor("")
    setSelectedImage(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">{cardTitle}</h1>
      <p className="text-lg mb-6">{description}</p>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">コメント</h2>

        {/* コメント投稿フォーム */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <Label htmlFor="author" className="mb-1">投稿者名</Label>
          <Input
            id="author"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            className="mb-3"
          />

          <Label htmlFor="comment" className="mb-1">コメント</Label>
          <Textarea
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-3"
          />

          <Label htmlFor="image" className="mb-1">写真を添付 (任意)</Label>
          <Input
            type="file"
            accept="image/*"
            id="image"
            onChange={handleImageChange}
            className="mb-3"
          />

          <Button onClick={handleCommentSubmit} className="mt-3">コメントを投稿</Button>
        </div>

        {/* コメントリスト */}
        {comments.map((comment, index) => (
          <Card key={index} className="mb-4">
            <CardHeader className="flex items-center space-x-4">
              <Avatar>{comment.author.charAt(0)}</Avatar>
              <div>
                <CardTitle>{comment.author}</CardTitle>
                <p>{comment.text}</p>
                {comment.imageUrl && <img src={comment.imageUrl} alt="Comment Image" className="mt-2 rounded-lg" />}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* 戻るリンク */}
      <a href="/" className="mt-6 inline-block text-blue-600 hover:underline">
        戻る
      </a>
    </div>
  )
}

export default CardDetailPage
