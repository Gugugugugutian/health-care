const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePhone = (phone) => {
    // Basic phone validation - can be enhanced based on requirements
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const validateHealthId = (healthId) => {
    // Health ID should be alphanumeric and at least 3 characters
    const re = /^[A-Za-z0-9]{3,50}$/;
    return re.test(healthId);
};

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

const validateDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

const validateTime = (timeString) => {
    const re = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return re.test(timeString);
};

const validateLicenseNumber = (licenseNumber) => {
    // Basic validation for medical license numbers
    const re = /^[A-Za-z0-9\-]{5,20}$/;
    return re.test(licenseNumber);
};

const validateConsultationType = (type) => {
    return ['In-Person', 'Virtual'].includes(type);
};

const validateInvitationType = (type) => {
    return ['challenge', 'family'].includes(type);
};

module.exports = {
    validateEmail,
    validatePhone,
    validateHealthId,
    validatePassword,
    validateDate,
    validateTime,
    validateLicenseNumber,
    validateConsultationType,
    validateInvitationType
};