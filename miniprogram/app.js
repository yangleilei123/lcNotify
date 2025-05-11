// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "cloud1-0g1521lva4601a73",
        traceUser: true,
      });
    }

    this.globalData = {};
    // this.getUserInfo();
  },

  getUserInfo: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 如果缓存中存在用户信息，直接使用
      this.globalData.userInfo = userInfo;
    } else {
      // 如果缓存中不存在用户信息，获取用户信息
      wx.getUserProfile({
        desc: '用于完善个人信息',
        success: (res) => {
          const userInfo = res.userInfo;
          wx.setStorageSync('userInfo', userInfo);
          this.globalData.userInfo = userInfo;
          // this.saveUserInfoToDatabase(userInfo);
        },
        fail: (err) => {
          console.error('获取用户信息失败', err);
          // wx.showModal({
          //   title: '授权提示',
          //   content: '请在小程序设置中开启用户信息授权，以便正常使用签到功能。',
          //   confirmText: '去设置',
          //   success: (res) => {
          //     if (res.confirm) {
          //       wx.openSetting({
          //         success: (res) => {
          //           console.log(res.authSetting);
          //         }
          //       });
          //     }
          //   }
          // });
        }
      });
    }
  },

  
});

