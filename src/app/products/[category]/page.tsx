import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { companyInfo } from "@/data/company";
import { getPublicCategories, getPublicCategoryBySlug, getPublicProductsByCategory } from "@/lib/publicProducts";
import EnquiryButton from "@/components/EnquiryButton";

export const dynamic = "force-dynamic";

// Helper function moved outside of the component to resolve naming/scope issues
function slugify(raw: string): string {
  return raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function generateStaticParams() {
  const categories = await getPublicCategories();
  return categories.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = await getPublicCategoryBySlug(category);
  return { title: cat ? `${cat.name} - Radiatech Electra` : "Products" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  
  const canonical = slugify(decodeURIComponent(category));
  if (canonical !== category) redirect(`/products/${canonical}`);

  const cat = await getPublicCategoryBySlug(category);
  if (!cat) {
    const catByCanonical = await getPublicCategoryBySlug(canonical);
    if (catByCanonical) redirect(`/products/${catByCanonical.slug}`);
    notFound();
  }

  const products = await getPublicProductsByCategory(category);

  return (
    <main className="bg-white">
      {/* Header */}
      <section className="bg-gray-50 py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Link href="/products" className="hover:text-accent">Products</Link>
            <ChevronRight size={14} />
            <span>{cat.name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">{cat.name}</h1>
          <p className="text-gray-600 text-lg max-w-2xl">{cat.description}</p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                <Link href={`/products/${category}/${product.id}`} className="relative h-64 overflow-hidden block">
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  {product.isNewArrival && (
                    <span className="absolute top-4 left-4 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">New</span>
                  )}
                </Link>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6">{product.description}</p>
                  <div className="flex items-center gap-3">
                    <Link href={`/products/${category}/${product.id}`} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-lg text-xs font-bold hover:bg-black transition-colors">
                      View <ArrowRight size={14} />
                    </Link>
                    <EnquiryButton productName={product.name} className="flex-1 border border-gray-200 py-3 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-gray-700 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">Need Expert Assistance?</h3>
            <p className="text-gray-400 text-sm">Our team is ready to help you find the perfect piping solution.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors">Send Inquiry</Link>
            <a href={`tel:${companyInfo.contact.phoneHref}`} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2">
              <Phone size={16} /> Call
            </a>
            <a href={`https://wa.me/${companyInfo.contact.whatsapp}`} target="_blank" className="bg-[#25D366] hover:bg-[#1da851] px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2">
              <MessageSquare size={16} /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
