import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../../contexts/AuthContext'
import { useBlogPosts } from '../../queries/blogQueries'
import { useDeleteBlogPost } from '../../mutations/blogMutations'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorBlogList = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const params = useMemo(() => {
    const p = {
      page,
      limit,
      authorId: user?.id,
    }

    if (filter === 'published') p.isPublished = true
    if (filter === 'draft') p.isPublished = false
    if (searchQuery.trim()) p.search = searchQuery.trim()

    return p
  }, [filter, limit, page, searchQuery, user?.id])

  const { data: blogsRes, isLoading } = useBlogPosts(params, {
    enabled: Boolean(user?.id),
  })

  const deleteBlog = useDeleteBlogPost()

  const payload = useMemo(() => blogsRes?.data ?? blogsRes, [blogsRes])
  const blogs = useMemo(() => payload?.blogPosts ?? [], [payload])
  const pagination = useMemo(() => payload?.pagination ?? null, [payload])

  const handleDelete = async (id, title) => {
    if (!id) return
    if (!window.confirm(`Are you sure you want to delete "${title || 'this post'}"?`)) return

    try {
      await deleteBlog.mutateAsync(id)
      toast.success('Blog post deleted successfully')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete blog post')
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="content doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar"></div>
          <div className="col-lg-12 col-xl-12">
            <div className="dashboard-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h3>Blog Posts</h3>
                  <p className="text-muted mb-0">Create and manage your blog posts</p>
                </div>
                <Link to="/doctor/blog/create" className="btn btn-primary">
                  <i className="fa fa-plus me-2" style={{ fontSize: '14px', display: 'inline-block', lineHeight: '1', visibility: 'visible', opacity: 1 }}></i>
                  Create Post
                </Link>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by title or content..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-control"
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="all">All</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div className="col-md-3 text-md-end">
                    <Link to="/doctor/dashboard" className="btn btn-outline-secondary">
                      <i className="fe fe-arrow-left me-2"></i>
                      Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            ) : blogs.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fe fe-file-text" style={{ fontSize: '64px', color: '#dee2e6' }}></i>
                  <h5 className="mt-3">No blog posts found</h5>
                  <p className="text-muted">Create your first post to get started.</p>
                  <Link to="/doctor/blog/create" className="btn btn-primary mt-3">
                    Create Blog Post
                  </Link>
                </div>
              </div>
            ) : (
              <div className="row">
                {blogs.map((blog) => {
                  const cover = blog.coverImage || blog.featuredImage
                  const coverUrl = getImageUrl(cover)
                  const statusBadge = blog.isPublished ? 'badge-success' : 'badge-warning'
                  const statusLabel = blog.isPublished ? 'Published' : 'Draft'

                  return (
                    <div key={blog._id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card h-100">
                        {coverUrl && (
                          <Link to={`/doctor/blog/${blog._id}`}>
                            <img
                              src={coverUrl}
                              alt={blog.title}
                              className="card-img-top"
                              style={{ height: '180px', objectFit: 'cover' }}
                            />
                          </Link>
                        )}
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className={`badge ${statusBadge}`}>{statusLabel}</span>
                            <div className="d-flex gap-2">
                              <Link
                                to={`/doctor/blog/edit/${blog._id}`}
                                className="btn btn-sm btn-outline-primary"
                                title="Edit"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '32px',
                                  height: '32px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="fa fa-edit" style={{ fontSize: '14px', display: 'inline-block', lineHeight: '1', visibility: 'visible', opacity: 1 }}></i>
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(blog._id, blog.title)}
                                disabled={deleteBlog.isPending}
                                title="Delete"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '32px',
                                  height: '32px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="fa fa-trash" style={{ fontSize: '14px', display: 'inline-block', lineHeight: '1', visibility: 'visible', opacity: 1 }}></i>
                              </button>
                            </div>
                          </div>

                          <h5 className="card-title">
                            <Link to={`/doctor/blog/${blog._id}`}>{blog.title}</Link>
                          </h5>
                          <p className="text-muted small mb-3">
                            {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '—'}
                          </p>

                          {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                            <div className="mb-3">
                              {blog.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="badge badge-info me-2">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto">
                            <Link to={`/doctor/blog/${blog._id}`} className="btn btn-outline-secondary w-100">
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {pagination && pagination.pages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </button>
                    </li>
                    <li className="page-item disabled">
                      <span className="page-link">Page {page} of {pagination.pages}</span>
                    </li>
                    <li className={`page-item ${page === pagination.pages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === pagination.pages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorBlogList
