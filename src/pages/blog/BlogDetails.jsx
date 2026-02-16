import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useBlogPost } from '../../queries/blogQueries'
import { getImageUrl } from '../../utils/apiConfig'

const BlogDetails = () => {
  const { id } = useParams()

  const { data: blogRes, isLoading, error } = useBlogPost(id)

  const payload = useMemo(() => blogRes?.data ?? blogRes, [blogRes])
  const blog = payload || null

  const formatDate = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    return d.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !blog?._id) {
    return (
      <div className="content">
        <div className="container">
          <div className="alert alert-danger mt-4">
            <h5>Blog post not found</h5>
            <p>{error?.message || "The blog post you're looking for doesn't exist."}</p>
            <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
          </div>
        </div>
      </div>
    )
  }

  const coverUrl = getImageUrl(blog?.coverImage || blog?.featuredImage)
  const author = blog?.authorId
  const authorName = author?.fullName || author?.name || 'Veterinary Team'
  const authorImg = getImageUrl(author?.profileImage) || '/assets/img/doctors/doctor-thumb-01.jpg'
  const dateLabel = formatDate(blog?.publishedAt || blog?.createdAt)
  const tags = Array.isArray(blog?.tags) ? blog.tags : []

  return (
    <div className="content">
      <div className="container">
        <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <Link to="/blog" className="btn btn-outline-secondary">
            <i className="fe fe-arrow-left me-2"></i>
            Back to Blog
          </Link>
        </div>

        <article className="card">
          {coverUrl && (
            <img
              src={coverUrl}
              className="card-img-top"
              alt={blog?.title || 'Blog'}
              style={{ maxHeight: '420px', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/assets/img/blog/blog-01.jpg'
              }}
            />
          )}
          <div className="card-body">
            <h1 className="card-title mb-3">{blog?.title || 'Blog Post'}</h1>

            <div className="d-flex align-items-center gap-3 text-muted flex-wrap mb-3">
              <div className="d-flex align-items-center">
                <img
                  src={authorImg}
                  alt={authorName}
                  className="rounded-circle me-2"
                  style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/assets/img/doctors/doctor-thumb-01.jpg'
                  }}
                />
                <span>{authorName}</span>
              </div>
              <span>•</span>
              <span>{dateLabel}</span>
            </div>

            {tags.length > 0 && (
              <div className="mb-3">
                {tags.map((t, idx) => (
                  <span key={`${t}-${idx}`} className="badge badge-info me-2">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="blog-content">
              <div
                dangerouslySetInnerHTML={{
                  __html: String(blog?.content || '').replace(/\n/g, '<br />'),
                }}
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export default BlogDetails
