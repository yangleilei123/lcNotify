// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const userInfo = event.userInfo

  try {
    // 检查用户是否已经注册
    const checkRes = await db.collection('users').where({
      openid: openid
    }).get()

    if (checkRes.data.length > 0) {
      return {
        success: false,
        error: '该用户已经注册过了'
      }
    }

    // 保存用户信息到用户表
    await db.collection('users').add({
      data: {
        openid: openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        registerTime: db.serverDate() // 记录注册时间
      }
    })

    return {
      success: true
    }
  } catch (e) {
    return {
      success: false,
      error: e
    }
  }
}