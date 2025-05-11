Page({
    data: {
      signInList: []
    },
  
    onLoad() {
      this.getSignInList();
    },
  
    getSignInList() {
      wx.cloud.callFunction({
        name: 'getSignInList',
        data: {
          date: new Date().toISOString().split('T')[0]
        },
        success: res => {
          this.setData({
            signInList: res.result.list
          });
        },
        fail: err => {
          console.error('获取签到列表失败', err);
        }
      });
    }
  });