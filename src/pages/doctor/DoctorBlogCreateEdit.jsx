import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useLanguage } from '../../contexts/LanguageContext'

import { useBlogPost } from '../../queries/blogQueries'
import { useCreateBlogPost, useUpdateBlogPost, useUploadBlogCoverImage } from '../../mutations/blogMutations'
import { getImageUrl } from '../../utils/apiConfig'
import RichTextEditor from '../../components/common/RichTextEditor'

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

const contentHasText = (value) => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim().length > 0

const DoctorBlogCreateEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()

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
        toast.error(t('doctorRemaining.blog.uploadFailed'))
        return
      }
      setCoverImage(url)
      toast.success(t('doctorRemaining.blog.imageUploaded'))
    } catch (err) {
      toast.error(err?.message || t('doctorRemaining.blog.imageUploadFailed'))
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error(t('doctorRemaining.blog.titleRequired'))
      return
    }

    if (!contentHasText(content)) {
      toast.error(t('doctorRemaining.blog.contentRequired'))
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
        toast.success(t('doctorRemaining.blog.saved'))
      } else {
        await createMutation.mutateAsync(data)
        toast.success(t('doctorRemaining.blog.createdSuccess'))
      }
      navigate('/doctor/blog')
    } catch (err) {
      toast.error(err?.message || t('doctorRemaining.blog.saveFailed'))
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
                  <h3>{isEdit ? t('doctorRemaining.blog.editTitle') : t('doctorRemaining.blog.createTitle')}</h3>
                  <p className="text-muted mb-0">{isEdit ? t('doctorRemaining.blog.editSubtitle') : t('doctorRemaining.blog.createSubtitle')}</p>
                </div>
                <Link to="/doctor/blog" className="btn btn-outline-secondary">
                  <i className="fe fe-arrow-left me-2"></i>
                  {t('doctorRemaining.blog.backToList')}
                </Link>
              </div>
            </div>

            {isEdit && isLoading ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">{t('doctorRemaining.blog.loading')}</span>
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
                          <label className="form-label">{t('doctorRemaining.blog.titleLabel')}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">{t('doctorRemaining.blog.slug')}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">{t('doctorRemaining.blog.content')}</label>
                          <RichTextEditor
                            value={content}
                            onChange={setContent}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">{t('doctorRemaining.blog.tags')}</label>
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
                          <label className="form-label">{t('doctorRemaining.blog.status')}</label>
                          <select
                            className="form-control"
                            value={isPublished ? 'published' : 'draft'}
                            onChange={(e) => setIsPublished(e.target.value === 'published')}
                            disabled={isSubmitting}
                          >
                            <option value="draft">{t('doctorRemaining.blog.draft')}</option>
                            <option value="published">{t('doctorRemaining.blog.published')}</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">{t('doctorRemaining.blog.coverImage')}</label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                            disabled={isSubmitting || uploadMutation.isPending}
                          />
                          {uploadMutation.isPending && (
                            <div className="small text-muted mt-2">{t('doctorRemaining.blog.uploading')}</div>
                          )}
                        </div>

                        {previewUrl && (
                          <div className="mb-3">
                            <img
                              src={previewUrl}
                              alt={t('doctorRemaining.blog.coverPreview')}
                              className="img-fluid rounded"
                              style={{ maxHeight: '220px', objectFit: 'cover' }}
                            />
                          </div>
                        )}

                        <div className="d-grid gap-2">
                          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? t('doctorRemaining.blog.saving') : isEdit ? t('doctorRemaining.blog.update') : t('doctorRemaining.blog.saveCreate')}
                          </button>
                          {isEdit && payload?._id && (
                            <Link to={`/doctor/blog/${payload._id}`} className="btn btn-outline-secondary">
                              {t('doctorRemaining.blog.view')}
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
