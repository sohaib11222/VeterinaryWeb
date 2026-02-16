import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useBlogPosts } from '../../queries/blogQueries'
import { getImageUrl } from '../../utils/apiConfig'

const BlogList = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 9

  const params = useMemo(() => {
    const p = { page, limit, isPublished: true }
    if (searchQuery.trim()) p.search = searchQuery.trim()
    return p
  }, [limit, page, searchQuery])

  const { data: blogsRes, isLoading, error } = useBlogPosts(params)

  const payload = useMemo(() => blogsRes?.data ?? blogsRes, [blogsRes])
  const blogs = useMemo(() => payload?.blogPosts ?? [], [payload])
  const pagination = useMemo(
    () => payload?.pagination ?? { page: 1, limit, total: 0, pages: 0 },
    [payload, limit]
  )

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getExcerpt = (blog) => {
    const raw = String(blog?.excerpt || blog?.description || blog?.content || '')
    const cleaned = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!cleaned) return ''
    return `${cleaned.slice(0, 160)}${cleaned.length > 160 ? '...' : ''}`
  }

  return (
    <>
      <div className="breadcrumb-bar">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">
                      <i className="isax isax-home-15"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active">Blog</li>
                </ol>
                <h2 className="breadcrumb-title">Blog</h2>
              </nav>
            </div>
          </div>

          <div className="bg-primary-gradient rounded-pill doctors-search-box">
            <div className="search-box-one rounded-pill">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setPage(1)
                }}
              >
                <div className="search-input search-line">
                  <i className="isax isax-search-normal-15 bficon"></i>
                  <div className="mb-0">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search articles"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>
                </div>
                <div className="form-search-btn">
                  <button
                    className="btn btn-primary d-inline-flex align-items-center rounded-pill"
                    type="submit"
                  >
                    <i className="isax isax-search-normal-15 me-2"></i>
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="breadcrumb-bg">
          <img src="/assets/img/bg/breadcrumb-bg-01.png" alt="" className="breadcrumb-bg-01" />
          <img src="/assets/img/bg/breadcrumb-bg-02.png" alt="" className="breadcrumb-bg-02" />
          <img src="/assets/img/bg/breadcrumb-icon.png" alt="" className="breadcrumb-bg-03" />
          <img src="/assets/img/bg/breadcrumb-icon.png" alt="" className="breadcrumb-bg-04" />
        </div>
      </div>

      <div className="content">
        <div className="container">
          {error && (
            <div className="alert alert-danger">
              {error?.message || 'Failed to load blog posts'}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No blog posts found.
            </div>
          ) : (
            <div className="row">
              {blogs.map((blog) => {
                const id = blog?._id
                const cover = getImageUrl(blog?.coverImage || blog?.featuredImage)
                const author = blog?.authorId
                const authorName = author?.fullName || author?.name || 'Veterinary Team'
                const date = blog?.publishedAt || blog?.createdAt
                const dateLabel = date ? new Date(date).toLocaleDateString() : '—'
                const excerpt = getExcerpt(blog)
                const tags = Array.isArray(blog?.tags) ? blog.tags.slice(0, 3) : []

                return (
                  <div key={id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <Link to={id ? `/blog/${id}` : '/blog'}>
                        <img
                          src={cover || '/assets/img/blog/blog-01.jpg'}
                          alt={blog?.title || 'Blog'}
                          className="card-img-top"
                          style={{ height: '180px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = '/assets/img/blog/blog-01.jpg'
                          }}
                        />
                      </Link>

                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">
                          <Link to={id ? `/blog/${id}` : '/blog'}>
                            {blog?.title || 'Blog Post'}
                          </Link>
                        </h5>

                        <div className="text-muted small mb-2">
                          <span>{authorName}</span>
                          <span className="mx-2">•</span>
                          <span>{dateLabel}</span>
                        </div>

                        {tags.length > 0 && (
                          <div className="mb-2">
                            {tags.map((t) => (
                              <span key={t} className="badge badge-info me-2">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {excerpt && <p className="text-muted">{excerpt}</p>}

                        <div className="mt-auto">
                          <Link to={id ? `/blog/${id}` : '/blog'} className="btn btn-outline-secondary w-100">
                            Read More
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {pagination?.pages > 1 && (
            <div className="col-md-12 mt-4 text-center">
              <button
                type="button"
                className="btn btn-outline-primary me-2"
                disabled={page <= 1}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
              >
                Previous
              </button>
              <span className="mx-3">
                Page {pagination.page || page} of {pagination.pages}
              </span>
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={page >= pagination.pages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default BlogList
