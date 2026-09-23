"use client";

import { useRef, useState } from "react";
import { OUTPUT_FORMATS, formatBytes, isSupportedImageType } from "@/lib/tools/image-compressor";
import type { OutputFormat } from "@/lib/tools/image-compressor";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { ToolActionsBar, ToolBody, ToolFeedback, ToolPane } from "@/components/tool/tool-shell";

interface SourceImage {
  file: File;
  url: string;
}

/**
 * Image Compressor — Canvas pipeline entirely in the browser
 * (File → Image → Canvas → toBlob → Download); nothing is uploaded.
 */
export function ImageCompressorTool() {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const onFileChange = (file: File | undefined) => {
    setResult(null);
    setError(null);
    if (!file) return;
    if (!isSupportedImageType(file.type)) {
      setError("仅支持 JPG / PNG / WebP 图片");
      return;
    }
    if (source) URL.revokeObjectURL(source.url);
    setSource({ file, url: URL.createObjectURL(file) });
  };

  const compress = async () => {
    if (!source) return;
    setProcessing(true);
    setError(null);
    try {
      const image = await loadImage(source.url);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("浏览器不支持 Canvas");
      ctx.drawImage(image, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format, quality / 100),
      );
      if (!blob) throw new Error("压缩失败，请重试");
      if (result) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "压缩失败");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolBody>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Source */}
        <ToolPane label="原始图片（本地处理，不上传）" className="min-h-[260px]">
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              onFileChange(event.dataTransfer.files[0]);
            }}
          >
            {source ? (
              <div className="flex min-h-0 flex-1 w-full flex-col items-center gap-2">
                <img
                  src={source.url}
                  alt="预览"
                  className="max-h-[240px] w-auto max-w-full rounded-sm border border-border"
                />
                <p className="text-[12px] text-muted-text">
                  {source.file.name} · {formatBytes(source.file.size)}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-muted-text">拖拽图片到这里，或点击选择</p>
                <Button onClick={() => inputRef.current?.click()}>选择图片</Button>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => onFileChange(event.target.files?.[0])}
              aria-label="选择图片文件"
            />
          </div>
        </ToolPane>

        {/* Result */}
        <ToolPane label="压缩结果" className="min-h-[260px]">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4">
            {result ? (
              <div className="flex w-full flex-col items-center gap-2">
                <img src={result.url} alt="压缩结果预览" className="max-h-[240px] w-auto max-w-full rounded-sm" />
                <p className="text-[12px] text-secondary-text">
                  {formatBytes(result.blob.size)}
                  {source && `（原 ${formatBytes(source.file.size)}）`}
                </p>
                <a
                  href={result.url}
                  download={downloadName(source?.file.name ?? "image", format)}
                  className="inline-flex h-9 items-center rounded-sm bg-accent px-3 text-[13px] font-medium text-accent-fg hover:bg-accent-hover"
                >
                  下载
                </a>
              </div>
            ) : (
              <p className="text-[13px] text-muted-text">
                {source ? "设置质量与格式后点击压缩" : "先选择一张图片"}
              </p>
            )}
          </div>
        </ToolPane>
      </div>

      <ToolFeedback text={error} tone="error" />

      <ToolActionsBar>
        <label className="flex items-center gap-2 text-[13px] text-secondary-text">
          质量 {quality}%
          <input
            type="range"
            min={10}
            max={100}
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
            aria-label="压缩质量"
            className="w-40"
          />
        </label>
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as OutputFormat)}
          aria-label="输出格式"
          className="h-9 rounded-sm border border-border bg-panel px-2 text-[13px] text-foreground outline-none"
        >
          {OUTPUT_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <Button variant="primary" loading={processing} disabled={!source} onClick={compress}>
          压缩
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (source) URL.revokeObjectURL(source.url);
            if (result) URL.revokeObjectURL(result.url);
            setSource(null);
            setResult(null);
            setError(null);
          }}
        >
          清空
        </Button>
      </ToolActionsBar>
    </ToolBody>
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败"));
    image.src = url;
  });
}

function downloadName(name: string, format: OutputFormat): string {
  const ext = format.split("/")[1];
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}.compressed.${ext}`;
}
