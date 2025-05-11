// open-data/index.js
Page({
    onLoad() {
        const openDataContext = wx.getOpenDataContext();
        const data = openDataContext.getViewData();
        console.log('用户信息:', data);
    }
});