import axios from 'axios';
import { showAlert } from './alert';

// eslint-disable-next-line no-undef
// const stripe = Stripe(
//   'pk_test_51ToM3OBzP1RO8O6r3My2jUc1WwZhVvPjOqRX3AgSxyBGCUWa1h7MQtpUlQImBcY0MRrwQAHR0QxqgsH5ciJfHonS00VYdmj7ML',
// );

const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const { data } = await axios.get(
      `http://localhost:3000/api/v1/booking/checkout-session/${tourId}`,
    );
    // 2) Create checkout form + charge credit card
    // eslint-disable-next-line no-undef
    window.location.assign(data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

export { bookTour };


