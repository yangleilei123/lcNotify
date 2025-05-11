// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const res = await db.collection('users')
    .orderBy('registerTime', 'asc') // 按注册时间升序排序
    .get()
    const userInfos = res.data.map(item => ({
      nickName: item.nickName,
      avatarUrl: item.avatarUrl
    }))
    console.log('从数据库获取的用户信息:', res.data); // 添加日志
    console.log('处理后的用户信息:', userInfos); // 添加日志
    return {
      success: true,
      userInfos: userInfos
    }
  } catch (e) {
    return {
      success: false,
      error: e
    }
  }
}