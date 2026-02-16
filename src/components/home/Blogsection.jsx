import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import OwlCarousel from "react-owl-carousel";
import {
  Veterinary_blog_01,
} from "../../assets/images";
import { useBlogPosts } from "../../queries/blogQueries";
import { getImageUrl } from "../../utils/apiConfig";
import AOS from "aos";
import "aos/dist/aos.css";

const Blogsection = () => {
  //Aos

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
    });
  }, []);

  const options = {
    loop: true,
    margin: 24,
    dots: false,
    nav: true,
    smartSpeed: 2000,
    navContainer: ".slide-nav-15",
    navText: [
      '<i class="fa-solid fa-caret-left "></i>',
      '<i class="fa-solid fa-caret-right"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 1,
      },
      575: {
        items: 1,
      },
      768: {
        items: 2,
      },
      1000: {
        items: 3,
      },
      1300: {
        items: 3,
      },
    },
  };

  const { data: blogsRes, isLoading, error } = useBlogPosts(
    { page: 1, limit: 6, isPublished: true },
    { refetchOnWindowFocus: false, refetchOnReconnect: false, staleTime: 30_000 }
  );

  const blogs = useMemo(() => {
    const payload = blogsRes?.data ?? blogsRes;
    return payload?.blogPosts || [];
  }, [blogsRes]);

  const blogCards = useMemo(() => {
    if (blogs.length > 0) {
      return blogs.slice(0, 6).map((b) => {
        const id = b?._id;
        const link = id ? `/blog/${id}` : "/blog";
        const cover = getImageUrl(b?.coverImage || b?.featuredImage) || Veterinary_blog_01;
        const author = b?.authorId;
        const authorName = author?.fullName || author?.name || "Veterinary Team";
        const authorImg = getImageUrl(author?.profileImage) || "/assets/img/doctors/doctor-thumb-01.jpg";
        const date = b?.publishedAt || b?.createdAt;
        const dateLabel = date ? new Date(date).toLocaleDateString() : "—";
        const tags = Array.isArray(b?.tags) ? b.tags.slice(0, 3) : [];

        const raw = String(b?.excerpt || b?.description || b?.content || "");
        const cleaned = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const excerpt = cleaned ? `${cleaned.slice(0, 140)}${cleaned.length > 140 ? "..." : ""}` : "";

        return {
          key: id || Math.random(),
          link,
          title: b?.title || "Blog Post",
          authorName,
          authorImg,
          coverImg: cover,
          dateLabel,
          tags,
          excerpt,
        };
      });
    }

    return [];
  }, [blogs]);

  const carouselOptions = useMemo(() => {
    const canLoop = blogCards.length > 3;
    return {
      ...options,
      loop: canLoop,
      nav: blogCards.length > 1,
    };
  }, [blogCards.length]);
  
  return (
    <>
      {/* blog section */}
      <div className="blog-section-fourteen">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-header-fourteen service-inner-fourteen">
                <div className="service-inner-fourteen">
                  <div className="service-inner-fourteen-two">
                    <h3>BLOG</h3>
                  </div>
                </div>
                <h2>Our Blogs</h2>
                <p>Our Recent Articles</p>
              </div>
            </div>
          </div>
          {error ? (
            <div className="text-center py-5 text-danger">Failed to load articles</div>
          ) : isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : blogCards.length === 0 ? (
            <div className="text-center py-5 text-muted">No articles available.</div>
          ) : (
            <OwlCarousel
              className="blog-slider-fourteen owl-theme aos"
              data-aos="fade-up"
              {...carouselOptions}
            >
              {blogCards.map((b) => (
                <div key={b.key} className="card blog-inner-fourt-all">
                  <div className="card-body blog-inner-fourt-main">
                    <div className="blog-inner-right-fourt">
                      <Link to={b.link}>
                        <div className="blog-inner-right-img">
                          <img
                            src={b.coverImg}
                            alt="image"
                            className="img-fluid "
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = Veterinary_blog_01;
                            }}
                          />
                          <div className="blog-inner-top-content">
                            <img
                              src={b.authorImg}
                              alt=""
                              className="me-2"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/assets/img/doctors/doctor-thumb-01.jpg";
                              }}
                            />
                            <span>{b.authorName}</span>
                          </div>
                        </div>
                      </Link>
                      <Link
                        to={b.link}
                        className="blog-inner-right-fourt-care"
                      >
                        {b.title}
                      </Link>
                      <ul className="articles-list nav blog-articles-list">
                        <li>
                          <i>
                            <i className="feather-calendar" />
                          </i>{" "}
                          {b.dateLabel}
                        </li>
                      </ul>
                      {Array.isArray(b.tags) && b.tags.length > 0 && (
                        <ul className="articles-list nav blog-articles-list-two">
                          {b.tags.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                      {b.excerpt && <p>{b.excerpt}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </OwlCarousel>
          )}
          <div className="owl-nav slide-nav-15 text-end nav-control" />
          <div
            className="blog-btn-sec text-center aos aos-init aos-animate"
            data-aos="fade-up"
          >
            <Link
              to="/blog"
              className="btn btn-primary btn-view"
            >
              Read More Articles
            </Link>
          </div>
        </div>
      </div>
      {/* /blog section */}
    </>
  );
};

export default Blogsection;
