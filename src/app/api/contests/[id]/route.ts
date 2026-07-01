import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/contests/[id] — contest detail with entries (sorted by vote count)
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
          orderBy: { createdAt: "asc" },
          include: {
            photo: {
              include: {
                author: {
                  select: { id: true, username: true, avatarUrl: true },
                },
                tags: { include: { tag: true } },
                _count: {
                  select: { likes: true, comments: true },
                },
              },
            },
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
            votes: true,
          },
        },
        _count: {
          select: { entries: true, votes: true },
        },
      },
    })

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      )
    }

    // Determine if current user has voted (one vote per user per contest)
    const myVote = currentUser
      ? await db.contestVote.findUnique({
          where: {
            contestId_userId: { contestId: id, userId: currentUser.id },
          },
          select: { entryId: true },
        })
      : null

    // Sort entries by vote count desc
    const entriesWithVotes = contest.entries.map((e) => ({
      id: e.id,
      contestId: e.contestId,
      createdAt: e.createdAt,
      voteCount: e.votes.length,
      votedByMe: myVote?.entryId === e.id,
      photo: {
        id: e.photo.id,
        title: e.photo.title,
        description: e.photo.description,
        imageUrl: e.photo.imageUrl,
        createdAt: e.photo.createdAt,
        author: e.photo.author,
        tags: e.photo.tags.map((t) => t.tag.name),
        likeCount: e.photo._count.likes,
        commentCount: e.photo._count.comments,
        pulseScore: e.photo.pulseScore,
      },
      user: e.user,
    }))

    entriesWithVotes.sort((a, b) => b.voteCount - a.voteCount)

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
      createdAt: contest.createdAt,
      entryCount: contest._count.entries,
      voteCount: contest._count.votes,
      hasVoted: !!myVote,
      myEntryId: myVote?.entryId ?? null,
      entries: entriesWithVotes,
    })
  } catch (err) {
    console.error("[contest] GET error", err)
    return NextResponse.json(
      { error: "Failed to fetch contest" },
      { status: 500 }
    )
  }
}
