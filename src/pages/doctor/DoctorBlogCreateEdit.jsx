import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useBlogPost } from '../../queries/blogQueries'
import { useCreateBlogPost, useUpdateBlogPost, useUploadBlogCoverImage } from '../../mutations/blogMutations'
import { getImageUrl } from '../../utils/apiConfig'

const toTags = (input) => {
  if (!input) return []
  return String(input)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

const DoctorBlogCreateEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const isEdit = Boolean(id)

  const { data: blogRes, isLoading } = useBlogPost(id)
  const payload = useMemo(() => blogRes?.data ?? blogRes, [blogRes])

  const createMutation = useCreateBlogPost()
  const updateMutation = useUpdateBlogPost()
  const uploadMutation = useUploadBlogCoverImage()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [coverImage, setCoverImage] = useState('')

  const slugTouchedRef = useRef(false)

  useEffect(() => {
    if (!isEdit) return
    if (!payload?._id) return

    setTitle(payload.title || '')
    setSlug(payload.slug || '')
    setContent(payload.content || '')
    setTagsInput(Array.isArray(payload.tags) ? payload.tags.join(', ') : '')
    setIsPublished(Boolean(payload.isPublished))
    setCoverImage(payload.coverImage || payload.featuredImage || '')
    slugTouchedRef.current = true
  }, [isEdit, payload])

  const previewUrl = useMemo(() => getImageUrl(coverImage), [coverImage])

  const handleTitleChange = (val) => {
    setTitle(val)
    if (!slugTouchedRef.current) {
      setSlug(slugify(val))
    }
  }

  const handleSlugChange = (val) => {
    slugTouchedRef.current = true
    setSlug(slugify(val))
  }

  const handleUpload = async (file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await uploadMutation.mutateAsync(formData)
      const url = res?.data?.url || res?.data?.data?.url
      if (!url) {
        toast.error('Upload failed')
        return
      }
      setCoverImage(url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err?.message || 'Failed to upload image')
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!content.trim()) {
      toast.error('Content is required')
      return
    }

    const tags = toTags(tagsInput)

    const nowIso = new Date().toISOString()

    const data = {
      title: title.trim(),
      content: content.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(coverImage ? { coverImage, featuredImage: coverImage } : {}),
      tags,
      isPublished: Boolean(isPublished),
      ...(isPublished ? { publishedAt: payload?.publishedAt || nowIso } : { publishedAt: null }),
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ blogPostId: id, data })
        toast.success('Blog post updated successfully')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Blog post created successfully')
      }
      navigate('/doctor/blog')
    } catch (err) {
      toast.error(err?.message || 'Failed to save blog post')
    }
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
                  <h3>{isEdit ? 'Edit Blog Post' : 'Create Blog Post'}</h3>
                  <p className="text-muted mb-0">{isEdit ? 'Update your post details' : 'Write a new post for your audience'}</p>
                </div>
                <Link to="/doctor/blog" className="btn btn-outline-secondary">
                  <i className="fe fe-arrow-left me-2"></i>
                  Back to List
                </Link>
              </div>
            </div>

            {isEdit && isLoading ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Slug</label>
                          <input
                            type="text"
                            className="form-control"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Content</label>
                          <textarea
                            className="form-control"
                            rows="12"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Tags (comma separated)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select
                            className="form-control"
                            value={isPublished ? 'published' : 'draft'}
                            onChange={(e) => setIsPublished(e.target.value === 'published')}
                            disabled={isSubmitting}
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Cover Image</label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                            disabled={isSubmitting || uploadMutation.isPending}
                          />
                          {uploadMutation.isPending && (
                            <div className="small text-muted mt-2">Uploading...</div>
                          )}
                        </div>

                        {previewUrl && (
                          <div className="mb-3">
                            <img
                              src={previewUrl}
                              alt="Cover Preview"
                              className="img-fluid rounded"
                              style={{ maxHeight: '220px', objectFit: 'cover' }}
                            />
                          </div>
                        )}

                        <div className="d-grid gap-2">
                          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
                          </button>
                          {isEdit && payload?._id && (
                            <Link to={`/doctor/blog/${payload._id}`} className="btn btn-outline-secondary">
                              View Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorBlogCreateEdit
