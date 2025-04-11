import React, { useState } from 'react';
import ImageModal from './ImageModal';
import '../styles/Team.css';

const Team = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const teamMembers = [
    {
      name: "Sucharan",
      image: "/images/Charan.jpg"
    },
    {
      name: "Sriram",
      image: "/images/Sriram.jpg"
    },
    {
      name: "Harshith",
      image: "/images/Harshith.jpg"
    },
    {
      name: "Bhargav",
      image: "/images/Bhargav.jpg"
    },
    {
      name: "Viswanadh",
      image: "/images/Viswanadh.jpg"
    }
  ];

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    setIsModalOpen(true);
  };

  return (
    <div className="modern-team-container">
      <h2 className="modern-team-title">Meet Our Team</h2>
      <div className="modern-team-grid">
        {teamMembers.map((member) => (
          <div className="modern-team-card" key={member.name} onClick={() => handleImageClick(member.image)}>
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
          </div>
        ))}
      </div>
      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageSrc={selectedImage} />
    </div>
  );
};

export default Team; 