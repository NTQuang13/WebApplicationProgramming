import fs from "fs";
import path from "path";

const allowedCvRoots = [
  path.resolve(process.cwd(), "uploads"),
  path.resolve(process.cwd(), "uploads", "cvs"),
];

export function resolveCvAbsolutePath(rawPath) {
  if (!rawPath || typeof rawPath !== "string") {
    return null;
  }

  const isFilesystemAbsolute =
    /^[a-zA-Z]:[\\/]/.test(rawPath) || rawPath.startsWith("\\\\");
  const normalizedRawPath = rawPath.replace(/^[/\\]+/, "");
  const resolved = isFilesystemAbsolute
    ? path.normalize(rawPath)
    : path.resolve(process.cwd(), normalizedRawPath);

  const resolvedLower = resolved.toLowerCase();

  const isAllowed = allowedCvRoots.some((root) => {
    const rootLower = root.toLowerCase();
    return (
      resolvedLower === rootLower ||
      resolvedLower.startsWith(`${rootLower}${path.sep}`)
    );
  });

  return isAllowed ? resolved : null;
}

export function sendCvDownload(res, rawPath, downloadName) {
  const resolved = resolveCvAbsolutePath(rawPath);

  if (!resolved) {
    return res.status(403).json({ message: "Duong dan file khong hop le." });
  }

  if (!fs.existsSync(resolved)) {
    return res.status(404).json({ message: "File khong ton tai tren server." });
  }

  return res.download(resolved, downloadName || "cv.pdf");
}
