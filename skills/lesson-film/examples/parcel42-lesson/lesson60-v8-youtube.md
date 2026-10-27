# YouTube: How Does an Immutable Database Update a Row?

## Title

How Does an Immutable Database Update a Row?

Other candidates:
- How Apache Pinot Upserts Work Without Overwriting a Row
- Why Your Query Only Sees the Newest Row
- The Trick Behind Upserts in Apache Pinot
- Every Row Kept, One Window Lit

## Thumbnail

lesson60-v8-thumbnail.jpg ("immutable?"), 1280x720. The alternative is lesson60-v8-thumbnail-alt.jpg ("only one is lit").

## Description

If Apache Pinot never changes a sealed segment in place, how does an upsert update a row? This two minute film answers it with a parcel, a post office and a town full of houses.

You'll see why every update for a key reaches the same server, how the primary key map keeps one line per key, and how the valid doc IDs bitmap flips two bits when a newer row arrives. A late update shows why older rows stay dark, and compaction shows where the dark rows finally go.

Chapters
0:00 Where is parcel 42 right now?
0:30 Where does every update for a key go?
0:42 How does Pinot know which row is live?
0:56 What happens when a newer row arrives?
1:13 What if an update arrives late?
1:31 What does a query read, and where do old rows go?
1:42 So what's the whole trick?

Read more about upserts in the Pinot docs:
https://docs.pinot.apache.org/build-with-pinot/ingestion/upsert-dedup/upsert

Every frame and every note in this film is drawn by code, and the narration is a synthetic voice.

#ApachePinot #Upserts #Databases

## Upload

- Video: lesson60-v8.mp4 (the master, not the preview)
- Captions: lesson60-v8.srt, English
- Thumbnail: lesson60-v8-thumbnail.jpg
