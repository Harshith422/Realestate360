import React, { useState } from 'react';
import ImageModal from './ImageModal';
import '../styles/Team.css';

const Team = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const teamMembers = [
    {
      name: "Sucharan",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=387&auto=format&fit=crop"
    },
    {
      name: "Sriram",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=388&auto=format&fit=crop"
    },
    {
      name: "Harshith",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1170&auto=format&fit=crop"
    },
    {
      name: "Bhargav",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=461&auto=format&fit=crop"
    },
    {
      name: "Viswanadh",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=387&auto=format&fit=crop"
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
              <img src={member.image} alt={member.name} className="modern-team-image" />
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