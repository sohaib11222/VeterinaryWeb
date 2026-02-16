import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useBlogPost } from '../../queries/blogQueries'
import { getImageUrl } from '../../utils/apiConfig'

const DoctorBlogDetails = () => {
  const { id } = useParams()

  const { data: blogRes, isLoading } = useBlogPost(id)

  const payload = useMemo(() => blogRes?.data ?? blogRes, [blogRes])
  const blog = payload || null

  const formatDateTime = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-xl-3 theiaStickySidebar"></div>
            <div className="col-lg-12 col-xl-12">
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!blog?._id) {
    return (
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-xl-3 theiaStickySidebar"></div>
            <div className="col-lg-12 col-xl-12">
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fe fe-alert-circle" style={{ fontSize: '64px', color: '#dee2e6' }}></i>
                  <h5 className="mt-3">Blog post not found</h5>
                  <p className="text-muted">The blog post you're looking for doesn't exist or has been deleted.</p>
                  <Link to="/doctor/blog" className="btn btn-primary mt-3">
                    Back to Blog Posts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const author = blog.authorId || null
  const cover = blog.coverImage || blog.featuredImage
  const coverUrl = getImageUrl(cover)
  const authorImg = getImageUrl(author?.profileImage) || '/assets/img/doctors/doctor-thumb-01.jpg'

  return (
    <div className="content doctor-content">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-xl-3 theiaStickySidebar"></div>
          <div className="col-lg-12 col-xl-12">
            <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <Link to="/doctor/blog" className="btn btn-outline-secondary">
                <i className="fe fe-arrow-left me-2"></i>
                Back to Blog Posts
              </Link>
              <Link to={`/doctor/blog/edit/${blog._id}`} className="btn btn-outline-primary">
                <i className="fa fa-edit me-2" style={{ fontSize: '14px', display: 'inline-block', lineHeight: '1', visibility: 'visible', opacity: 1 }}></i>
                Edit
              </Link>
            </div>

            <article className="card">
              {coverUrl && (
                <img
                  src={coverUrl}
                  className="card-img-top"
                  alt={blog.title}
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
              )}
              <div className="card-body">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div>
                      <h1 className="card-title mb-2">{blog.title}</h1>
                      <div className="d-flex align-items-center gap-3 text-muted flex-wrap">
                        {author && (
                          <div className="d-flex align-items-center">
                            <img
                              src={authorImg}
                              alt={author.fullName || author.name || 'Author'}
                              className="rounded-circle me-2"
                              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = '/assets/img/doctors/doctor-thumb-01.jpg'
                              }}
                            />
                            <span>{author.fullName || author.name || 'Author'}</span>
                          </div>
                        )}
                        <span>•</span>
                        <span>{formatDateTime(blog.publishedAt || blog.createdAt)}</span>
                        <span>•</span>
                        <span className={`badge ${blog.isPublished ? 'badge-success' : 'badge-warning'}`}>
                          {blog.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                    <div className="mb-3">
                      {blog.tags.map((tag, idx) => (
                        <span key={idx} className="badge badge-info me-2">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="blog-content">
                  <div dangerouslySetInnerHTML={{ __html: String(blog.content || '').replace(/\n/g, '<br />') }} />
                </div>

                <div className="mt-4 pt-4 border-top">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="text-muted small">
                      Created: {formatDateTime(blog.createdAt)}
                      {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                        <> • Updated: {formatDateTime(blog.updatedAt)}</>
                      )}
                    </div>
                    <div>
                      <Link to="/doctor/blog" className="btn btn-outline-secondary btn-sm me-2">
                        Back to List
                      </Link>
                      <Link to={`/doctor/blog/edit/${blog._id}`} className="btn btn-primary btn-sm">
                        Edit Post
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorBlogDetails
