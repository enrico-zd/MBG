export type TaskType =
  | "pixverse.upload_image"
  | "pixverse.generate_segment"
  | "pixverse.poll_segment"
  | "video.stitch_segments"

export type UploadImageTaskPayload = { segmentId: string }
export type GenerateSegmentTaskPayload = { segmentId: string }
export type PollSegmentTaskPayload = { segmentId: string }
export type StitchSegmentsTaskPayload = { adJobId: string }

