// src/utils/phoneUtils.ts

export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove any non-digit characters
  let formattedPhone = phone.replace(/\D/g, '');

  // If the number starts with 0, replace it with Israel country code (972)
  if (formattedPhone.startsWith('0')) {
    formattedPhone = `972${formattedPhone.substring(1)}`;
  }

  return formattedPhone;
};

export const openWhatsApp = (phone: string, message: string = ''): void => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);

  // Create the WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

  // Open in a new tab
  window.open(whatsappUrl, '_blank');
};
