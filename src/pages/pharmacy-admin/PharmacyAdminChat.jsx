import AdminDoctorChat from '../doctor/AdminDoctorChat'

// The Admin-support experience is intentionally shared with the Doctor panel.
// The mode changes only the authenticated participant field and the server-side
// conversation type; message history and attachments remain the same feature.
const PharmacyAdminChat = () => <AdminDoctorChat mode="business" />

export default PharmacyAdminChat
