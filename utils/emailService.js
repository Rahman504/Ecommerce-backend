const nodemailer = require("nodemailer");

const sendReceipt = async (email, order) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Confirmation - ${order.paymentReference}`,
    html: `
      <h2>Thanks for your order!</h2>
      <p>Order ID: ${order._id}</p>
      <ul>
        ${order.orderItems.map(item => `<li>${item.name} x ${item.qty} - ₦${item.price}</li>`).join("")}
      </ul>
      <p><strong>Total: ₦${order.totalPrice}</strong></p>
      <p>Shipping to: ${order.shippingAddress.address}, ${order.shippingAddress.city}</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendReceipt;