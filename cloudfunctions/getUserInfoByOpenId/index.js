// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { openid } = event

  try {
    // 查询用户信息
    const userInfo = await usersCollection.where({
      openid: openid
    }).get()

    if (userInfo.data && userInfo.data.length > 0) {
      return {
        success: true,
        userInfo: userInfo.data[0]
      }
    } else {
      return {
        success: false,
        message: '未找到用户信息'
      }
    }
  } catch (error) {
    console.error('查询用户信息失败：', error)
    return {
      success: false,
      error: error
    }
  }
}