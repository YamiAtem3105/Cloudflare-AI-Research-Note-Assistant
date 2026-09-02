export async function uploadFile(
  bucket: R2Bucket,
  key: string,
  file: File,
) {
  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType:
        file.type || "application/octet-stream",
    },
  });
}

export async function getFile(
  bucket: R2Bucket,
  key: string,
) {
  return bucket.get(key);
}

export async function deleteFile(
  bucket: R2Bucket,
  key: string,
) {
  await bucket.delete(key);
}