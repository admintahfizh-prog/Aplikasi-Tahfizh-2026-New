/**
 * Utility functions for image file reading, compression, and converting to base64 Data URLs.
 * Keeps payload lightweight for Firestore documents and localStorage.
 */

export async function fileToCompressedBase64(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> {
  // If SVG or tiny GIF, read directly
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        // Output as jpeg or webp
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get initials for avatar fallback (e.g. "Ahmad Fauzan" -> "AF")
 */
export function getInitials(name?: string, fallback = 'U'): string {
  if (!name || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const DEFAULT_MALE_STUDENT_AVATAR = '/avatars/male_student.jpg';
export const DEFAULT_FEMALE_STUDENT_AVATAR = '/avatars/female_student.jpg';

/**
 * Returns the student avatar image URL based on gender (L / P) or their uploaded photo.
 */
export function getStudentAvatar(student?: { gender?: string; photo?: string } | null): string {
  if (student?.photo && student.photo.trim() !== '' && !student.photo.includes('unsplash')) {
    return student.photo;
  }
  const rawGender = student?.gender ? String(student.gender).trim().toUpperCase() : '';
  const isFemale =
    rawGender === 'P' ||
    rawGender === 'PEREMPUAN' ||
    rawGender.startsWith('P') ||
    rawGender.includes('PUTRI') ||
    rawGender.includes('PEREMPUAN');

  return isFemale ? DEFAULT_FEMALE_STUDENT_AVATAR : DEFAULT_MALE_STUDENT_AVATAR;
}

