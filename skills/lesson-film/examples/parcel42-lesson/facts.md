# What the 60 s lesson may claim, checked against apache/pinot master on 2026-09-25

1. The stream is partitioned by primary key, and upsert tables must use strict replica-group routing
   (`TableConfigUtils`: "Upsert/Dedup table must use strict replica-group (i.e. strictReplicaGroup) based routing").
   So every version of key 42 is consumed by the same server, and one partition's metadata manager sees them all.
2. Each partition keeps one in-memory map, `_primaryKeyToRecordLocationMap`, a `ConcurrentHashMap` from the
   hashed primary key to a `RecordLocation(segment, docId, comparisonValue)` (`ConcurrentMapPartitionUpsertMetadataManager`).
3. Each segment has a `validDocIds` bitmap (a `ThreadSafeMutableRoaringBitmap`), one bit per row (doc id).
4. When a row for an existing key arrives (`doAddRecord`): if its comparison value is >= the stored one (a tie keeps
   the newer row), `replaceDocId` clears the old doc id's bit in the old segment and sets the new doc id's bit in the
   consuming segment, and the map now points at the new location.
5. If its comparison value is smaller, it is out of order: the row is still written to the segment, the map is not
   changed, and its bit is never set (`handleOutOfOrderEvent`, `isOutOfOrderRecord`).
6. The comparison column defaults to the table's time column (`BaseTableUpsertMetadataManager`), and can be set with
   `comparisonColumns`.
7. A query's filter starts from each segment's doc id snapshot of those bits (`FilterPlanNode`, `getDocIdsSnapshot()`),
   so rows whose bit is off are never read.
8. The old rows stay in their segments until the `UpsertCompactionTask` minion task rewrites a segment without them.

The fixture, reused from Parcel 42: key 42 is placed 09:02, packed 11:15, shipped 14:08, delivered 16:30, and a late
"packed 12:10" arrives after "shipped". The time column is the comparison column.
