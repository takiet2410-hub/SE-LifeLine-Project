/**
 * Helper trích xuất Dynamic Payload (Chỉ gửi Dirty Fields)
 * Tuân thủ chuẩn REST API PATCH: Người dùng sửa ô nào, FE chỉ gửi ô đó xuống Backend.
 */
export function getDirtyPayload<T extends Record<string, any>>(
  dirtyFields: Record<string, any>,
  allValues: T,
  originalValues?: Record<string, any>
): Partial<T> {
  const dirtyPayload: Partial<T> = {};

  // So sánh thủ công nếu không truyền dirtyFields (hoặc dirtyFields rỗng) và có originalValues
  if ((!dirtyFields || Object.keys(dirtyFields).length === 0) && originalValues) {
    Object.keys(allValues).forEach((key) => {
      if (JSON.stringify(allValues[key]) !== JSON.stringify(originalValues[key])) {
        dirtyPayload[key as keyof T] = allValues[key];
      }
    });
    return dirtyPayload;
  }

  if (dirtyFields) {
    Object.keys(dirtyFields).forEach((key) => {
      if (dirtyFields[key]) {
        // Nếu là nested object (VD: permanentAddress, currentAddress)
        if (typeof dirtyFields[key] === 'object' && !Array.isArray(dirtyFields[key])) {
          dirtyPayload[key as keyof T] = getDirtyPayload(
            dirtyFields[key],
            allValues[key] || {}
          ) as any;
        } else {
          dirtyPayload[key as keyof T] = allValues[key];
        }
      }
    });
  }

  return dirtyPayload;
}
