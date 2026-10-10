<script setup lang="ts">
import ThemeToggle from '@/components/ThemeToggle.vue'
import loginBg from '@/assets/img/login-bg.jpg';
import { useAuthStore } from '@/stores/auth';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await auth.login(form);
    ElMessage.success('登录成功');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    await router.replace(redirect);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login">
    <aside class="login__visual" aria-hidden="true">
      <img class="login__photo" :src="loginBg" alt="" />
      <div class="login__visual-copy">
        <p class="login__brand">团子食光</p>
        <p class="login__tagline">把宝宝今天吃什么，安稳地记下来</p>
      </div>
    </aside>

    <main class="login__panel">
      <ThemeToggle class="login__theme" />
      <div class="login__form">
        <p class="login__kicker">管理后台</p>
        <h1>欢迎回来</h1>
        <p class="login__lead">登录后即可维护食材、分类和小程序内容。</p>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" maxlength="32" placeholder="请输入用户名" @keyup.enter="handleSubmit" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password maxlength="32" placeholder="请输入密码" @keyup.enter="handleSubmit" />
          </el-form-item>
          <el-button type="primary" class="login__btn" :loading="loading" @click="handleSubmit">进入后台</el-button>
        </el-form>
      </div>
      <p class="login__credit">由程垒开发设计</p>
    </main>
  </div>
</template>

<style scoped>
.login {
  height: 100dvh;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 480px;
  background: var(--app-bg);
}

.login__visual {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.login__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.login__visual-copy {
  position: absolute;
  left: 40px;
  bottom: 40px;
  color: #4a3038;
}

.login__brand {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.login__tagline {
  margin: 0;
  font-size: 15px;
  color: #8d6b75;
}

.login__panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 32px 36px;
  background: var(--app-bg);
}

.login__theme {
  position: absolute;
  top: 16px;
  right: 16px;
}

.login__form {
  width: 100%;
  max-width: 400px;
  margin-top: -50%;
}

.login__kicker {
  margin: 0 0 10px;
  color: var(--app-primary);
  font-size: 13px;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 650;
  color: var(--app-text);
}

.login__lead {
  margin: 0 0 22px;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.6;
}

.login__form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.login__form :deep(.el-form-item__label) {
  color: var(--app-text);
  font-weight: 500;
}

.login__form :deep(.el-input__wrapper) {
  padding: 8px 14px;
  box-shadow: 0 0 0 1px var(--app-border) inset;
  background: var(--app-surface);
}

.login__form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--app-primary) inset;
}

.login__btn {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  border: none;
  background: var(--app-primary);
}

.login__btn:hover,
.login__btn:focus {
  background: var(--app-primary-hover);
}

.login__credit {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 28px;
  margin: 0;
  text-align: center;
  color: var(--app-muted);
  font-size: 12px;
  letter-spacing: 0.08em;
}

@media (max-width: 860px) {
  .login {
    grid-template-columns: 1fr;
    grid-template-rows: 180px 1fr;
  }

  .login__visual {
    min-height: 0;
  }

  .login__visual-copy {
    left: 24px;
    bottom: 20px;
  }

  .login__panel {
    padding: 32px 24px 48px;
  }
}
</style>
