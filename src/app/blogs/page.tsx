import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight, User } from "lucide-react";
import { parseBlogImages, parseBlogTags, getPublishedBlogsPage } from "@/lib/publicBlogs";

export const metadata = {
  title: "Blog & Insights - Radiatech Electra",
  description: "Industry insights, technical guides, and the latest updates on PPR-C piping solutions.",
};

export const dynamic = "force-dynamic";

const pageSize = 9;

function pageHref(page: number) {
  return page <= 1 ? "/blogs" : `/blogs?page=${page}`;
}

export default async function BlogsPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const resolvedSearchParams = await searchParams;
  const rawPage = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
  const requestedPage = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);
  const { items: blogs, pagination } = await getPublishedBlogsPage(requestedPage, pageSize);
  const pages = Array.from({ length: pagination.totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === pagination.totalPages || Math.abs(item - pagination.page) <= 1);

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="bg-red-700 py-18">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6">Blog & Insights</h1>
          <p className="text-red-100 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            Industry insights, technical guides, and the latest updates on Fire &  Safety solutions.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          {blogs.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No blog posts published yet. Check back soon!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => {
                const tags = parseBlogTags(blog.tags);
                const thumbnail = blog.coverImage || parseBlogImages(blog.images)[0] || "";
                return (
                  <Link key={blog.id} href={`/blogs/${blog.slug}`} className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <div className="relative h-60 overflow-hidden">
                      {thumbnail ? (
                        <Image src={thumbnail} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-full w-full bg-gray-100" />
                      )}
                      {tags[0] && <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{tags[0]}</span>}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-4 text-gray-400 text-xs mb-4 font-medium uppercase tracking-wide">
                        <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        <span className="flex items-center gap-1.5"><User size={14} />{blog.author}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-red-700 transition-colors line-clamp-2">{blog.title}</h3>
                      <p className="text-gray-600 text-sm mb-6 flex-grow line-clamp-3">{blog.excerpt}</p>
                      <span className="inline-flex items-center gap-2 text-red-600 font-bold text-sm group-hover:gap-3 transition-all">
                        Read Article <ArrowRight size={16} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-2">
              <Link href={pageHref(pagination.page - 1)} className={`px-4 py-2 border rounded-lg ${pagination.page === 1 ? "pointer-events-none text-gray-300" : "hover:border-red-700 hover:text-red-700"}`}>Prev</Link>
              {pages.map((item) => (
                <Link key={item} href={pageHref(item)} className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${item === pagination.page ? "bg-red-700 text-white" : "border hover:border-red-700"}`}>
                  {item}
                </Link>
              ))}
              <Link href={pageHref(pagination.page + 1)} className={`px-4 py-2 border rounded-lg ${pagination.page === pagination.totalPages ? "pointer-events-none text-gray-300" : "hover:border-red-700 hover:text-red-700"}`}>Next</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
