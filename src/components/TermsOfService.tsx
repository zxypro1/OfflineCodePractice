import React from 'react';
import { Modal, Stack, Title, Text, List, Alert, ScrollArea, Anchor } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useI18n } from '../contexts/I18nContext';

interface TermsOfServiceProps {
  opened: boolean;
  onClose: () => void;
}

export function TermsOfService({ opened, onClose }: TermsOfServiceProps) {
  const { locale } = useI18n();

  const content = locale === 'zh' ? (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={20} />} title="重要声明" color="blue" variant="light">
        <Text size="sm" fw={700}>
          所有上传到题目市场的内容将自动遵循 MIT 开源协议。
        </Text>
      </Alert>

      <div>
        <Title order={3} mb="xs">1. 服务条款总则</Title>
        <Text size="sm">
          欢迎使用 Offline LeetCode Practice 题目市场。通过注册和使用本服务，您同意遵守以下条款：
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">2. 开源协议（重要）</Title>
        <Alert color="yellow" variant="filled" mb="xs">
          <Text size="sm" fw={700}>
            📜 所有上传的题目将自动采用 MIT 开源协议
          </Text>
        </Alert>
        <Text size="sm" mb="xs">
          这意味着：
        </Text>
        <List size="sm" spacing="xs">
          <List.Item>
            <Text component="span" fw={600}>任何人都可以自由使用</Text>：任何用户都可以下载、使用、修改和分发您上传的题目。
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>无需征得您的许可</Text>：其他用户无需事先获得您的同意即可使用您的题目。
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>可商业使用</Text>：您的题目可以被用于商业目的，包括但不限于教育培训、出版等。
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>需保留版权声明</Text>：使用您题目的人需要在其副本中保留原始的版权声明和许可声明。
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>不提供担保</Text>：题目按"原样"提供，不提供任何形式的明示或暗示担保。
          </List.Item>
        </List>
        <Text size="sm" mt="xs" c="dimmed">
          完整的 MIT 协议内容请访问：
          <Anchor href="https://opensource.org/licenses/MIT" target="_blank" ml={4}>
            https://opensource.org/licenses/MIT
          </Anchor>
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">3. 用户责任</Title>
        <List size="sm" spacing="xs">
          <List.Item>您确认您拥有上传内容的合法权利，或已获得必要的授权。</List.Item>
          <List.Item>您不得上传包含侵权、非法、有害或不当内容的题目。</List.Item>
          <List.Item>您理解并同意上传的题目将被公开分享给所有用户。</List.Item>
          <List.Item>您对上传内容的准确性和质量负责。</List.Item>
        </List>
      </div>

      <div>
        <Title order={3} mb="xs">4. 内容审核与删除</Title>
        <Text size="sm">
          我们保留审核、编辑或删除违反本协议或适用法律的内容的权利，但不承担主动审核的义务。
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">5. 免责声明</Title>
        <Text size="sm">
          本服务按"原样"提供。我们不对题目的准确性、完整性或适用性做任何保证。用户使用本服务的风险由其自行承担。
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">6. 知识产权</Title>
        <Text size="sm">
          上传到市场的所有题目将自动采用 MIT 开源协议。您保留对原始作品的署名权，但授予所有用户 MIT 协议规定的使用权利。
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">7. 服务变更</Title>
        <Text size="sm">
          我们保留随时修改或终止服务的权利，恕不另行通知。重大变更将通过适当方式通知用户。
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">8. 协议变更</Title>
        <Text size="sm">
          本协议可能会不定期更新。继续使用服务即表示您接受修订后的条款。
        </Text>
      </div>

      <Alert color="red" variant="light" mt="md">
        <Text size="sm" fw={600}>
          ⚠️ 再次提醒：上传题目即表示您同意该题目采用 MIT 开源协议，并允许任何人自由使用、修改和分发。
        </Text>
      </Alert>
    </Stack>
  ) : (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={20} />} title="Important Notice" color="blue" variant="light">
        <Text size="sm" fw={700}>
          All content uploaded to the Problem Market will be automatically licensed under the MIT License.
        </Text>
      </Alert>

      <div>
        <Title order={3} mb="xs">1. Terms of Service Overview</Title>
        <Text size="sm">
          Welcome to the Offline LeetCode Practice Problem Market. By registering and using this service, you agree to abide by the following terms:
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">2. Open Source License (Important)</Title>
        <Alert color="yellow" variant="filled" mb="xs">
          <Text size="sm" fw={700}>
            📜 All uploaded problems will automatically be licensed under the MIT License
          </Text>
        </Alert>
        <Text size="sm" mb="xs">
          This means:
        </Text>
        <List size="sm" spacing="xs">
          <List.Item>
            <Text component="span" fw={600}>Free to use by anyone</Text>: Any user can download, use, modify, and distribute your uploaded problems.
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>No permission required</Text>: Other users do not need your prior consent to use your problems.
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>Commercial use allowed</Text>: Your problems can be used for commercial purposes, including but not limited to education, training, and publishing.
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>Attribution required</Text>: Users of your problems must retain the original copyright and license notices in their copies.
          </List.Item>
          <List.Item>
            <Text component="span" fw={600}>No warranty</Text>: Problems are provided "as is" without any express or implied warranties.
          </List.Item>
        </List>
        <Text size="sm" mt="xs" c="dimmed">
          For the full MIT License text, visit:
          <Anchor href="https://opensource.org/licenses/MIT" target="_blank" ml={4}>
            https://opensource.org/licenses/MIT
          </Anchor>
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">3. User Responsibilities</Title>
        <List size="sm" spacing="xs">
          <List.Item>You confirm that you have the legal rights to the content you upload, or have obtained necessary authorization.</List.Item>
          <List.Item>You must not upload problems containing infringing, illegal, harmful, or inappropriate content.</List.Item>
          <List.Item>You understand and agree that uploaded problems will be publicly shared with all users.</List.Item>
          <List.Item>You are responsible for the accuracy and quality of your uploaded content.</List.Item>
        </List>
      </div>

      <div>
        <Title order={3} mb="xs">4. Content Moderation and Removal</Title>
        <Text size="sm">
          We reserve the right to review, edit, or remove content that violates this agreement or applicable laws, but we do not assume an obligation to actively moderate.
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">5. Disclaimer</Title>
        <Text size="sm">
          This service is provided "as is." We make no warranties regarding the accuracy, completeness, or suitability of the problems. Users use this service at their own risk.
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">6. Intellectual Property</Title>
        <Text size="sm">
          All problems uploaded to the market will automatically be licensed under the MIT License. You retain attribution rights to your original work, but grant all users the usage rights specified in the MIT License.
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">7. Service Changes</Title>
        <Text size="sm">
          We reserve the right to modify or terminate the service at any time without prior notice. Significant changes will be communicated to users through appropriate channels.
        </Text>
      </div>

      <div>
        <Title order={3} mb="xs">8. Agreement Changes</Title>
        <Text size="sm">
          This agreement may be updated periodically. Continued use of the service indicates your acceptance of the revised terms.
        </Text>
      </div>

      <Alert color="red" variant="light" mt="md">
        <Text size="sm" fw={600}>
          ⚠️ Reminder: By uploading problems, you agree that they will be licensed under the MIT License and allow anyone to freely use, modify, and distribute them.
        </Text>
      </Alert>
    </Stack>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={locale === 'zh' ? '服务条款与开源协议' : 'Terms of Service & Open Source License'}
      size="lg"
      centered
    >
      <ScrollArea h={500} type="auto">
        {content}
      </ScrollArea>
    </Modal>
  );
}
