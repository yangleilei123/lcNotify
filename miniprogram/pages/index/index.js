// pages/index/index.js
Page({
    data: {
      currentDate: '',  // 当前日期
      paperSetter: '',  // 今日出题人
      setterList: [],  // 出题人列表
      isSigned: false,  // 签到状态
      signInList: [],    // 签到列表
    //   allUserNicknames: [], // 所有用户昵称
      allUserInfos: [], // 所有用户信息
      isSigning: false, // 新增：标识是否正在签到
      isAuthorized: false,
      nickname: '',
      avatarUrl: '',
    },
    onNicknameInput(e) {
      this.setData({
        nickname: e.detail.value
      });
    },
  
    onChooseAvatar(e) {
        try {
            if (e.detail && e.detail.avatarUrl) {
                console.log('选择的头像URL:', e.detail.avatarUrl);
                const tempFilePath = e.detail.avatarUrl;
                const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`;
                
                wx.showLoading({
                    title: '上传中...',
                });

                wx.cloud.uploadFile({
                    cloudPath: cloudPath,
                    filePath: tempFilePath,
                    success: res => {
                        console.log('上传成功', res);
                        const fileID = res.fileID;
                        this.setData({
                            avatarUrl: fileID
                        });
                        wx.hideLoading();
                    },
                    fail: err => {
                        console.error('上传失败', err);
                        wx.hideLoading();
                        wx.showToast({
                            title: '上传失败，请重试',
                            icon: 'none'
                        });
                    }
                });
            } else {
                console.log('用户取消了选择头像');
                wx.showToast({
                    title: '已取消选择头像',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.log('选择头像过程出现异常:', error);
            wx.showToast({
                title: '选择头像失败，请重试',
                icon: 'none'
            });
        }
    },
  
    onLoad() {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.setData({
                isAuthorized: true
            });
            this.getAllUserNicknames()
                .then(() => {
                    this.updateDateAndSetter();
                    this.checkSignStatus();
                    this.getSignInList();
                })
                .catch(err => {
                    console.error('获取出题人列表失败', err);
                });
            return;
        }
        this.checkUserInfoByOpenId();
    },

    // 通过openid检查用户信息
    checkUserInfoByOpenId() {
        wx.cloud.callFunction({
            name: 'getOpenId',
            success: res => {
                const openid = res.result.openid;
                wx.cloud.callFunction({
                    name: 'getUserInfoByOpenId',
                    data: {
                        openid: openid
                    },
                    success: res => {
                        console.log('checkUserInfoByOpenId ', res.result.success);
                        if (res.result.success && res.result.userInfo) {
                            console.log('查询用户信息成功, 设置用户信息', res.result.userInfo);
                            wx.setStorageSync('userInfo', res.result.userInfo);
                            this.setData({
                                isAuthorized: true,
                                avatarUrl: res.result.userInfo.avatarUrl,
                                nickname: res.result.userInfo.nickName
                            });
                            this.getAllUserNicknames()
                                .then(() => {
                                    this.updateDateAndSetter();
                                    this.checkSignStatus();
                                    this.getSignInList();
                                })
                                .catch(err => {
                                    console.error('获取出题人列表失败', err);
                                });
                        } else {
                            console.log('查询用户信息失败, 设置用户信息为空');
                            wx.showModal({
                              title: '提示',
                              content: '未查询到您的信息，请先提交您的信息',
                              showCancel: false,
                              success: (res) => {
                                if (res.confirm) {
                                  console.log('未查询到您的信息，请先提交您的信息');
                                }
                              }
                            });
                            this.setData({
                                isAuthorized: false
                            });
                        }
                    },
                    fail: err => {
                        console.error('查询用户信息失败', err);
                        this.setData({
                            isAuthorized: false
                        });
                    }
                });
            },
            fail: err => {
                console.error('获取openid失败', err);
                this.setData({
                    isAuthorized: false
                });
            }
        });
    },

    onSubmitInfo() {
      const { nickname, avatarUrl } = this.data;
      if (nickname && avatarUrl) {
        const userInfo = {
          nickName: nickname,
          avatarUrl: avatarUrl
        };
        wx.setStorageSync('userInfo', userInfo);
        const app = getApp();
        app.globalData.userInfo = userInfo;
        this.saveUserInfoToDatabase(userInfo);
        this.setData({
          isAuthorized: true
        });
        // 提交信息后刷新出题人信息
        // this.getAllUserNicknames()
        //   .then(() => {
        //     this.updateDateAndSetter();
        //     this.getSignInList();
        //     console.log('当前日期:', this.data.currentDate);
        //     console.log('今日出题人列表:',this.data.setterList)
        //     console.log('今日出题人:', this.data.paperSetter);
        //   })
        //   .catch(err => {
        //     console.error('刷新出题人信息失败', err);
        //   });
      } else {
        wx.showToast({
          title: '请输入昵称和头像链接',
          icon: 'none'
        });
      }
    },
    saveUserInfoToDatabase: function (userInfo) {
      const date = new Date().toISOString().split('T')[0];
      wx.cloud.callFunction({
        name: 'registerUser',
        data: {
          userInfo: userInfo
        },
        success: res => {
          if (res.result.success) {
            this.setData({
              isAuthorized: true
            });
            wx.showToast({
              title: '注册成功',
              icon: 'success'
            });
            // 等待一段时间后再获取用户列表，确保数据库写入完成
            setTimeout(() => {
              this.getAllUserNicknames()
                  .then(() => {
                      this.updateDateAndSetter();
                      this.getSignInList();
                      console.log('当前日期:', this.data.currentDate);
                      console.log('今日出题人列表:', this.data.setterList);
                      console.log('今日出题人:', this.data.paperSetter);
                  })
                  .catch(err => {
                      console.error('刷新出题人信息失败', err);
                  });
          }, 1000); // 等待1秒
          } else {
            console.error('注册失败', res.result.error);
            wx.showToast({
              title: '注册失败',
              icon: 'none'
            });
          }
        },
        fail: err => {
          console.error('注册失败', err);
          wx.showToast({
            title: '注册失败',
            icon: 'none'
          });
        }
      });
    },
    // 获取所有用户的昵称作为出题人列表
    async getAllUserNicknames() {
        return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'getAllUserNicknames',
            success: res => {
                console.log(res)
            if (res.result.success) {
                this.setData({
                // setterList: res.result.nicknames,
                // allUserNicknames: res.result.nicknames,
                setterList: res.result.userInfos.map(item => item.nickName),
                allUserInfos: res.result.userInfos
                });
                console.log('出题人列表:', this.data.setterList); // 打印出题人列表
                resolve();
            } else {
                reject(res.result.error);
            }
            },
            fail: err => {
            reject(err);
            }
        });
        });
    },
    // 更新日期和出题人信息
    updateDateAndSetter() {
      const date = new Date();
      // 格式化日期为 YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // 如果出题人列表为空，直接设置 paperSetter 为空
      if (this.data.setterList.length === 0) {
        this.setData({
          currentDate: formattedDate,
          paperSetter: ''
        });
        return;
      }
  
      // 计算从某个固定日期开始的天数差，确定出题人
      // 以2023年1月1日为基准，当天出题人为A
      const baseDate = new Date(2023, 0, 1);  // 注意：月份从0开始
      const timeDiff = date.getTime() - baseDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      const setterIndex = daysDiff % this.data.setterList.length;
      const setter = this.data.setterList[setterIndex];
  
      this.setData({
        currentDate: formattedDate,
        paperSetter: setter
      });
    },
  
    // 获取签到列表
    getSignInList() {
      // 这里假设使用云函数获取签到列表
      wx.cloud.callFunction({
        name: 'getSignInList',
        data: {
          date: this.data.currentDate
        },
        success: res => {
          console.log('getSignInList res:', res);
          this.setData({
            signInList: res.result.list
          });
          console.log('签到列表:', this.data.signInList);
        },
        fail: err => {
          console.error('获取签到列表失败', err);
        }
      });
    },
  
    // 检查签到状态
    checkSignStatus() {
      const today = this.data.currentDate;
      wx.cloud.callFunction({
        name: 'checkSignIn',
        data: {
          date: today
        },
        success: res => {
          this.setData({
            isSigned: res.result.isSigned
          });
        },
        fail: err => {
          console.error('检查签到状态失败', err);
        }
      });
    },
  
    // 签到方法
    signIn() {
      if (this.data.isSigned || this.data.isSigning) {
        wx.showToast({
          title: '你已经签过到了',
          icon: 'none'
        });
        return;
      }
      const app = getApp();
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        // 如果缓存中有用户信息，直接进行签到
        this.setData({ isSigning: true }); // 开始签到，禁用按钮
        this.doSignIn(userInfo);
        console.log(11111);
      } else {
        console.log(22222);
        wx.showModal({
          title: '提示',
          content: '请先提交您的信息',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              console.log('用户点击确定');
            }
          }
        });
      }
      
    },
  
    // 实际执行签到的方法
    doSignIn(userInfo) {
      wx.cloud.callFunction({
        name: 'signIn',
        data: {
          date: this.data.currentDate,
          userInfo: userInfo
        },
        success: res => {
          this.setData({ isSigning: false }); // 签到请求完成，启用按钮
          if (res.result.success) {
            this.setData({
              isSigned: true
            });
            wx.showToast({
              title: '签到成功',
              icon: 'success'
            });
            this.getSignInList(); // 签到成功后刷新签到列表
          } else {
            console.error('签到失败', res.result.error);
            wx.showToast({
              title: '签到失败',
              icon: 'none'
            });
          }
        },
        fail: err => {
          this.setData({ isSigning: false }); // 签到请求失败，启用按钮
          console.error('签到失败', err);
          wx.showToast({
            title: '签到失败',
            icon: 'none'
          });
        }
      });
    }
  });