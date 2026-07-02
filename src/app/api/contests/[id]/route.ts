import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const contest = await db.contest.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { votes: { _count: "desc" } },
          include: {
            photo: {
              include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                tags: { include: { tag: true } },
                _count: { select: { likes: true, comments: true } },
              },
            },
            user: { select: { id: true, username: true } },
            _count: { select: { votes: true } },
            ...(currentUser
              ? { votes: { where: { userId: currentUser.id }, select: { id: true } } }
              : {}),
          },
        },
        _count: { select: { entries: true, votes: true } },
      },
    })

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 })
    }

    // Check if current user has already voted in this contest
    const myVote = currentUser
      ? await db.contestVote.findFirst({
          where: { contestId: id, userId: currentUser.id },
          select: { entryId: true },
        })
      : null

    // Check if current user has entered this contest
    const myEntry = currentUser
      ? await db.contestEntry.findFirst({
          where: { contestId: id, userId: currentUser.id },
          select: { id: true, photoId: true },
        })
      : null

    return NextResponse.json({
      id: contest.id,
      title: contest.title,
      description: contest.description,
      theme: contest.theme,
      prize: contest.prize,
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
      status: contest.status,
      bannerUrl: contest.bannerUrl,
      entryCount: contest._count.entries,
      voteCount: contest._count.votes,
      myVoteEntryId: myVote?.entryId ?? null,
      myEntryId: myEntry?.id ?? null,
      myEntryPhotoId: myEntry?.photoId ?? null,
      entries: contest.entries.map((e) => ({
        id: e.id,
        photoId: e.photoId,
        userId: e.userId,
        username: e.user.username,
        createdAt: e.createdAt,
        voteCount: e._count.votes,
        votedByMe: currentUser ? (e.votes?.length ?? 0) > 0 : false,
        photo: {
          id: e.photo.id,
          title: e.photo.title,
          imageUrl: e.photo.imageUrl,
          createdAt: e.photo.createdAt,
          author: e.photo.author,
          tags: e.photo.tags.map((t) => t.tag.name),
          likeCount: e.photo._count.likes,
          commentCount: e.photo._count.comments,
        },
      })),
    })
  } catch (err) {
    console.error("[contest detail] error", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
