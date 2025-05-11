// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const date = event.date

  // 检查该用户在当天是否已经签到
  const checkRes = await db.collection('signInRecords').where({
    openid: openid,
    date: date
  }).get()

  if (checkRes.data.length > 0) {
    return {
      success: false,
      error: '该用户在当天已经签到过了'
    }
  }

  try {
    // 保存用户信息到用户表
    // const userInfo = event.userInfo
    // await db.collection('users').where({
    //   openid: openid
    // }).get().then(res => {
    //   if (res.data.length === 0) {
    //     return db.collection('users').add({
    //       data: {
    //         openid: openid,
    //         nickName: userInfo.nickName,
    //         avatarUrl: userInfo.avatarUrl
    //       }
    //     })
    //   }
    // })

    // 保存签到记录到签到表
    await db.collection('signInRecords').add({
      data: {
        openid: openid,
        date: date
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