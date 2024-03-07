"use client";
import Giscus from "@giscus/react";
export default function DiscussionPage() {
  return (
    <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto my-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <Giscus
          id="comments"
          repo="NathanKun/resonance-columba"
          repoId="R_kgDOLay83w"
          mapping="number"
          term="28"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme="light"
          lang="zh-CN"
          loading="lazy"
        />
      </div>
    </div>
  );
}
