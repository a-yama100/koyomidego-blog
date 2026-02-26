import Link from 'next/link'

export function Legend() {
  return (
    <section className="p-6 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200">
      <h3 className="font-bold text-gray-700 mb-3">{'\u51e1\u4f8b\uff08\u30af\u30ea\u30c3\u30af\u3067\u8a73\u7d30\u3078\uff09'}</h3>
      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/about#ichiryuu" className="px-2 py-1 rounded-md border-2 bg-amber-100 text-amber-800 border-amber-300 font-bold hover:bg-amber-200 transition-colors">{'\u4e00\u7c92\u4e07\u500d\u65e5'}</Link>
        <Link href="/about#tensha" className="px-2 py-1 rounded-md border-2 bg-yellow-100 text-yellow-800 border-yellow-300 font-bold hover:bg-yellow-200 transition-colors">{'\u5929\u8d66\u65e5'}</Link>
        <Link href="/about#tora" className="px-2 py-1 rounded-md border-2 bg-orange-100 text-orange-800 border-orange-300 font-bold hover:bg-orange-200 transition-colors">{'\u5bc5\u306e\u65e5'}</Link>
        <Link href="/about#mi" className="px-2 py-1 rounded-md border-2 bg-emerald-100 text-emerald-800 border-emerald-300 font-bold hover:bg-emerald-200 transition-colors">{'\u5df3\u306e\u65e5'}</Link>
        <Link href="/about#kinoe" className="px-2 py-1 rounded-md border-2 bg-blue-100 text-blue-800 border-blue-300 font-bold hover:bg-blue-200 transition-colors">{'\u7532\u5b50\u306e\u65e5'}</Link>
        <Link href="/about#tatsu" className="px-2 py-1 rounded-md border-2 bg-cyan-100 text-cyan-800 border-cyan-300 font-bold hover:bg-cyan-200 transition-colors">{'\u8fb0\u306e\u65e5'}</Link>
        <Link href="/about#void" className="px-2 py-1 rounded-md border-2 bg-red-100 text-red-600 border-red-300 font-bold hover:bg-red-200 transition-colors">{'VoC = \u30dc\u30a4\u30c9\u30bf\u30a4\u30e0'}</Link>
        <Link href="/about#fuseijoubi" className="px-2 py-1 rounded-md border-2 bg-gray-200 text-gray-600 border-gray-300 font-bold hover:bg-gray-300 transition-colors line-through">{'\u4e0d\u6210\u5c31\u65e5'}</Link>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        {'\u203b \u30dc\u30a4\u30c9\u30bf\u30a4\u30e0\u4e2d\u306f\u65b0\u3057\u3044\u3053\u3068\u3092\u59cb\u3081\u308b\u306e\u306b\u9069\u3055\u306a\u3044\u3068\u3055\u308c\u3066\u3044\u307e\u3059\u3002\u203b \u4e0d\u6210\u5c31\u65e5\u306f\u5409\u65e5\u306e\u52b9\u679c\u304c\u534a\u6e1b\u3059\u308b\u3068\u3055\u308c\u308b\u65e5\u3067\u3059\u3002'}
      </p>
    </section>
  )
}
