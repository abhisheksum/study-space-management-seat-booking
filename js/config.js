/**
 * StudyHub - Global Configuration & Center Metadata
 * 
 * Centralized contact and operating hours config.
 * Update values here to automatically reflect across the contact page,
 * footers, WhatsApp links, and direct dial buttons without touching HTML markup.
 */

const STUDYHUB_CONFIG = {
  centerName: "StudyHub Self-Study Center",
  tagline: "Your Seat. Your Time. Your Focus.",
  
  // Contact numbers
  phone: "+91 98765 43210",
  phoneClean: "+919876543210",
  landline: "011-23456789",
  
  // WhatsApp settings
  whatsappNumber: "+919876543211",
  whatsappDisplay: "+91 98765 43211",
  whatsappDefaultMessage: "Hello StudyHub! I am interested in checking seat availability and scheduling an in-person study trial.",
  
  // Email addresses
  email: "desk@studyhubcenter.com",
  supportEmail: "support@studyhubcenter.com",
  
  // Physical Location
  address: {
    line1: "Plot 42, Institutional Area, Knowledge Park III",
    landmark: "Near Metro Station Gate 2, Opposite Education Complex",
    city: "Greater Noida",
    state: "Uttar Pradesh",
    pincode: "201306",
    fullAddress: "Plot 42, Knowledge Park III, Near Metro Gate 2, Greater Noida, UP - 201306"
  },
  
  // Operational Hours
  hours: {
    allDays: "06:00 AM – 11:00 PM (Daily, 365 Days)",
    shifts: {
      morning: "06:00 AM – 12:00 PM",
      afternoon: "12:00 PM – 06:00 PM",
      evening: "06:00 PM – 10:00 PM",
      fullDay: "06:00 AM – 11:00 PM"
    },
    visitingHours: "09:00 AM – 07:00 PM (Tours & Desk Demos)"
  },

  // Google Maps Coordinates / Embed parameters
  mapLocation: {
    title: "StudyHub Self-Study Center, Knowledge Park III",
    query: "Knowledge+Park+III+Greater+Noida"
  }
};

// Export to global window object
if (typeof window !== 'undefined') {
  window.STUDYHUB_CONFIG = STUDYHUB_CONFIG;
}
