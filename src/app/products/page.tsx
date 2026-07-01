import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowRight, Download } from "lucide-react";
import EnquiryButton from "@/components/EnquiryButton";
import { getPublicCategories, getPublicNewArrivals } from "@/lib/publicProducts";

export const metadata = {
  title: "Products - Radiatech Electra",
  description: "Browse our complete range of PPR-C pipes, fittings, and industrial piping solutions.",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [categories, newArrivals] = await Promise.all([
    getPublicCategories(),
    getPublicNewArrivals(12),
  ]);

  return (
    <main className="bg-white">
      {/* Header */}
      <section className="bg-gray-50 py-5 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6">Our Products</h1>
          <p className="text-lg text-gray-600 max-w-2xl mb-8">Complete range of fire protection systems, high-quality safety equipment, and end-to-end industrial fire safety solutions for all applications.</p>
          {/* <div className="flex flex-wrap gap-4">
            <a href="/RADIATECH-CATALOGUE.pdf" download className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 transition-all">
              Download Product Brochure <Download size={18} />
            </a>
          </div> */}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Product Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <div key={cat.slug} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                <Link href={`/products/${cat.slug}`} className="relative h-64 overflow-hidden block">
                  <Image src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.name}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">{cat.description}</p>
                  <div className="flex items-center gap-3">
                    <Link href={`/products/${cat.slug}`} className="flex-1 bg-gray-900 text-white text-center py-3 rounded-lg text-xs font-bold hover:bg-black transition-colors">
                      View Products
                    </Link>
                    <EnquiryButton productName={cat.name} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">New Arrivals</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                <Link href={`/products/${product.categorySlug}/${product.id}`} className="relative h-48 mb-4 overflow-hidden rounded-lg block">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                  <span className="absolute top-2 left-2 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded">NEW</span>
                </Link>
                <Link href={`/products/${product.categorySlug}/${product.id}`} className="font-bold text-gray-900 text-sm mb-4 block hover:text-accent transition-colors">
                  {product.name}
                </Link>
                <EnquiryButton productName={product.name} label="Inquire" className="w-full border border-gray-200 text-gray-700 py-2 rounded-lg text-[11px] font-bold hover:bg-gray-50" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
