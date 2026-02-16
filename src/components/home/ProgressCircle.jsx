import React, { useState, useEffect } from "react";

const ProgressCircle = () => {
  const [scroll, setScroll] = useState(0);
  const [isTop, setIsTop] = useState(false);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      setScroll(window.scrollY);
      setIsTop(window.scrollY > 300);
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <>
      {isTop && (
        <button
          onClick={scrollToTop}
          className="scroll-top scroll-to-target primary-btn"
          id="back-to-top"
        >
          <i className="fas fa-arrow-up" />
        </button>
      )}
    </>
  );
};

export default ProgressCircle;
