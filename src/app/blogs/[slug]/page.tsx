import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ArrowLeft, User, Tag } from "lucide-react";
import { companyInfo } from "@/data/company";
import BlogImageViewer from "@/components/BlogImageViewer";
import { getPublishedBlogBySlug, getRelatedBlogs, parseBlogImages, parseBlogTags } from "@/lib/publicBlogs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) return { title: "Blog - Radiatech Electra" };
  return {
    title: `${blog.title} - Radiatech Electra`,
    description: blog.excerpt,
    openGraph: { title: blog.title, description: blog.excerpt, images: blog.coverImage ? [{ url: blog.coverImage }] : undefined },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) notFound();

  const tags = parseBlogTags(blog.tags);
  const rawImages = parseBlogImages(blog.images);
  const allImages = rawImages.length > 0 ? rawImages : (blog.coverImage ? [blog.coverImage] : []);
  const relatedBlogs = await getRelatedBlogs(blog.slug, blog.id, 3);

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="bg-red-700 py-5">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/blogs" className="inline-flex items-center gap-2 text-red-200 hover:text-white text-sm font-medium mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
          {tags[0] && (
            <span className="inline-block bg-accent px-3 py-2 text-xs font-bold text-white uppercase tracking-widest mb-6 rounded-2xl ml-2">
              {tags[0]}
            </span>
          )}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">{blog.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-red-200 text-sm">
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-2">
              <User size={16} /> {blog.author}
            </span>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          {allImages.length > 0 && (
            <div className="mb-12 rounded-3xl overflow-hidden shadow-xl">
              <BlogImageViewer images={allImages} title={blog.title} />
            </div>
          )}

          <article className="blog-content prose prose-lg max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: blog.content }} />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap mt-16 pt-8 border-t border-gray-100">
              <Tag size={18} className="text-gray-400" />
              {tags.map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Modern CTA */}
          <div className="mt-20 bg-gray-900 rounded-3xl p-8 sm:p-12 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Need Help With Your Piping Project?</h3>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">Our experts are ready to help you find the perfect PPR-C piping solution.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="bg-red-600 hover:bg-red-700 rounded-2xl px-8 py-4 font-bold text-sm transition-all">Send Inquiry</Link>
              <a href={`https://wa.me/${companyInfo.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#1da851] px-8 py-4 font-bold text-sm transition-all rounded-2xl">WhatsApp Us</a>
            </div>
          </div>

          {/* Related Posts */}
          {relatedBlogs.length > 0 && (
            <div className="mt-24">
              <h3 className="text-2xl font-bold text-gray-900 mb-10">Related Articles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedBlogs.map((rb) => (
                  <Link key={rb.id} href={`/blogs/${rb.slug}`} className="group block">
                    <div className="relative h-56 rounded-2xl overflow-hidden mb-4 shadow-sm">
                      {rb.coverImage && <Image src={rb.coverImage} alt={rb.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <h4 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">{rb.title}</h4>
                    <p className="text-gray-500 text-sm mt-2">{new Date(rb.publishedAt || rb.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
