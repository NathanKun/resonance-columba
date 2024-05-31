import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-gray-800 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto my-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">雷索纳斯 科伦巴商会 数据分享站</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Columba Chamber of Commerce</p>
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div>
          <p className="text-gray-600 dark:text-gray-300 mt-2 mb-0 italic">
            哇，要是商会也有这个，交流各地交易所的情报岂不是超级方便？！
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-2 mt-0 text-end italic">—— 某列车长</p>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          项目的目标是代替传统的共享Excel文件，为雷索纳斯的玩家提供一个商品价格共享平台，以便玩家们可以更好的规划跑商。
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          感谢
          <Link href="https://space.bilibili.com/37824929" className="text-blue-500 dark:text-blue-400">
            黑子不是黑Black
          </Link>
          的共享Excel。
        </p>
        <p className="text-gray-600 dark:text-gray-300">感谢 粥盐籽 星辰月影 的数据支持与设计建议。</p>
        <p className="text-gray-600 dark:text-gray-300">感谢 洛菈米娅 的算法支持与设计建议。</p>
        <p className="text-gray-600 dark:text-gray-300">感谢Github上的贡献者与issue提交者。</p>
        <p className="text-gray-600 dark:text-gray-300">感谢索斯学会的技术支持。</p>
        <p className="text-gray-600 dark:text-gray-300">
          项目Github仓库:{" "}
          <Link href="https://github.com/nathankun/resonance-columba">
            https://github.com/nathankun/resonance-columba
          </Link>
        </p>
        <p className="text-gray-600 dark:text-gray-300">欢迎提交discussion，issue和PR。</p>
        <p className="text-gray-600 dark:text-gray-300">雷索纳斯交流群 474679095</p>
      </div>
    </div>
  );
}
