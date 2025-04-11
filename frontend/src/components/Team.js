import React from "react";
import "./Team.css";
import { motion } from 'framer-motion';

const teamMembers = [
  { 
    name: "Sucharan", 
    image: "/images/Charan.jpg",
  },
  { 
    name: "Sriram", 
    image: "/images/Sriram.jpg",
  },
  { 
    name: "Harshith", 
    image: "/images/Harshith.jpg",
  },
  { 
    name: "Bhargav", 
    image: "/images/Bhargav.jpg",
  },
  { 
    name: "Viswanadh", 
    image: "/images/Viswanadh.jpg",
  }
];

const Team = () => {
  return (
    <motion.div 
      className="modern-team-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="modern-team-header">
        <motion.h2 
          className="modern-team-title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          MEET OUR TEAM
        </motion.h2>
        <motion.p 
          className="modern-team-subtitle"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Our dedicated professionals are committed to helping you find your dream property with personalized service and expertise.
        </motion.p>
      </div>
      
      <motion.div 
        className="modern-team-frame"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      >
        <div className="modern-team-grid">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index} 
              className="modern-team-card"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.6 + index * 0.1,
                ease: "easeOut"
              }}
              whileHover={{ y: -10 }}
            >
              <div className="modern-team-image-container">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="modern-team-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${member.name}&size=200&background=random`;
                  }}
                />
              </div>
              <h3 className="modern-team-name">{member.name}</h3>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Team;
