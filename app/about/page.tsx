import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto my-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">雷索纳斯 科伦巴商会 数据分享站</h2>
          <p className="text-sm text-gray-500">Columba Chamber of Commerce</p>
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <p className="text-gray-600">
          项目的目标是代替传统的共享Excel文件，为雷索纳斯的玩家提供一个商品价格共享平台，以便玩家们可以更好的规划跑商。
        </p>
        <p className="text-gray-600">
          项目目前还处于非常早期的阶段，还可能有大量的重构和改动，可能暂时不方便接受PR，但欢迎提交discussion和issue。
        </p>
        <p className="text-gray-600">项目目前仅实现了大部分共享Excel的功能，之后会逐步增加更多的功能。</p>
        <p className="text-gray-600">
          感谢
          <Link href="https://space.bilibili.com/37824929">黑子不是黑Black</Link>
          的共享Excel https://www.kdocs.cn/l/cuPZppRuRJjO
        </p>
        <p className="text-gray-600">
          项目Github仓库:{" "}
          <Link href="https://github.com/nathankun/resonance-columba">
            https://github.com/nathankun/resonance-columba
          </Link>
        </p>
        <p className="text-gray-600">雷索纳斯交流群 474679095</p>
      </div>
    </div>
  );
}
