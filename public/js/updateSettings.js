import axios from "axios";
import { showAlert } from "./alert";

// type is either 'password' or 'data'
export const updateSettings = async(data,type) =>{
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://localhost:3000/api/v1/users/${type === 'password' ? 'updatePassword' : 'updateMe'}`,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Your data has been updated successfully!');
      // eslint-disable-next-line no-undef
      window.location.reload()
    }else{
      showAlert('error', res.message);
    }
  } catch (error) {
    console.log(error);
    showAlert(
      'error',
      error?.response?.data?.message || error.message || 'Something went wrong',
    );
  }
}

